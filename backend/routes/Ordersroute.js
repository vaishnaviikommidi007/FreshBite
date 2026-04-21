// routes/Ordersroute.js
// Usage: app.use('/api/orders', require('./routes/Ordersroute'))

const express = require("express");
const router  = express.Router();

async function resolveOrderTable(connection) {
  const [tables] = await connection.query("SHOW TABLES");
  const key = tables.length ? Object.keys(tables[0])[0] : null;
  const names = new Set((tables || []).map((row) => row[key]));

  if (names.has("orders_new")) return "orders_new";
  if (names.has("order_new")) return "order_new";

  // Fall back to the Node table name for clearer SQL errors if neither exists.
  return "orders";
}

async function getTableColumns(connection, tableName) {
  const [cols] = await connection.query(`SHOW COLUMNS FROM ${tableName}`);
  return new Set(cols.map((c) => c.Field));
}

async function ensureOrderReviewsTable(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS order_reviews (
      id INT PRIMARY KEY AUTO_INCREMENT,
      order_id INT NOT NULL,
      user_id INT NOT NULL,
      rating TINYINT NOT NULL,
      review_text TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_order_user (order_id, user_id)
    )
  `);
}

function toNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeStatus(status) {
  const raw = String(status || "").toLowerCase();
  if (raw === "pending") return "confirmed";
  if (raw === "on_the_way") return "out_for_delivery";
  return raw || "confirmed";
}

function formatTimeLabel(value) {
  const dt = value ? new Date(value) : null;
  if (!dt || Number.isNaN(dt.getTime())) return "Just now";

  const deltaSec = Math.max(0, (Date.now() - dt.getTime()) / 1000);
  if (deltaSec < 60) return "Just now";
  if (deltaSec < 3600) return `${Math.floor(deltaSec / 60)} min ago`;
  return dt.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function computeSimulatedRider(order, status) {
  if (!["rider_assigned", "out_for_delivery"].includes(status)) return null;

  const restaurantLat = toNumber(order.restaurant_lat, 17.385);
  const restaurantLng = toNumber(order.restaurant_lng, 78.4867);
  const customerLat = toNumber(order.pickup_lat ?? order.delivery_lat, 17.3616);
  const customerLng = toNumber(order.pickup_lng ?? order.delivery_lng, 78.4761);

  const createdAt = order.created_at ? new Date(order.created_at).getTime() : Date.now();
  const elapsedMin = Math.max(0, (Date.now() - createdAt) / 60000);

  // Delivery run starts after prep and gradually moves rider to customer.
  const progressBase = status === "out_for_delivery" ? 0.2 : 0.1;
  const progress = Math.min(0.99, Math.max(progressBase, (elapsedMin - 18) / 28));

  const current_lat = restaurantLat + (customerLat - restaurantLat) * progress;
  const current_lng = restaurantLng + (customerLng - restaurantLng) * progress;
  const distance_km = haversineKm(current_lat, current_lng, customerLat, customerLng);

  return {
    name: "Delivery Partner",
    area: order.pickup_area || "Nearby",
    current_lat,
    current_lng,
    distance_km,
    rating: 4.7,
    total_orders: 120,
  };
}

function computeEtaMinutes(status, rider, order) {
  if (status === "delivered") return 0;
  if (rider?.distance_km != null) {
    const avgSpeedKmPerMin = 0.4; // ~24km/h
    return Math.max(2, Math.round(rider.distance_km / avgSpeedKmPerMin));
  }

  const dist = toNumber(order?.distance_km, null);
  if (dist != null) {
    if (status === "confirmed") return Math.max(20, Math.round(dist * 5 + 15));
    if (status === "preparing") return Math.max(12, Math.round(dist * 4 + 8));
  }

  return status === "confirmed" ? 25 : 15;
}

function buildFallbackEvents(status, orderCreatedAt) {
  const labels = {
    confirmed: "Order confirmed",
    cook_found: "Cook assigned",
    preparing: "Your food is being prepared",
    rider_assigned: "Delivery partner assigned",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
  };

  return [{
    message: labels[status] || "Order update",
    created_at: orderCreatedAt,
    time_label: formatTimeLabel(orderCreatedAt),
  }];
}

async function inferSellerIdFromItems(connection, items) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const scores = new Map();
  for (const item of items) {
    const name = String(item?.name || item?.item_name || "").trim();
    if (!name) continue;

    try {
      const [rows] = await connection.execute(
        `SELECT seller_id FROM seller_menu WHERE LOWER(name) = LOWER(?) LIMIT 1`,
        [name]
      );
      const sellerId = Number(rows?.[0]?.seller_id);
      if (Number.isFinite(sellerId) && sellerId > 0) {
        scores.set(sellerId, (scores.get(sellerId) || 0) + 1);
      }
    } catch (_) {
      // seller_menu may not exist in all local setups
      return null;
    }
  }

  let bestSellerId = null;
  let bestScore = 0;
  for (const [sellerId, score] of scores.entries()) {
    if (score > bestScore) {
      bestSellerId = sellerId;
      bestScore = score;
    }
  }

  return bestSellerId;
}

// POST /api/orders/save
router.post("/save", async (req, res) => {
  const db = req.app.locals.db; // mysql2 pool — adjust if you use a different export

  const {
    user_id,
    items,            // array of cart items — saved to order_items table
    subtotal,
    gst,
    delivery_fee,
    total_amount,
    distance_km,
    delivery_address,
    custom_note,
    payment_method,
    pickup_lat,
    pickup_lng,
    pickup_area,
    seller_id,
  } = req.body;

  // ── Basic validation ──────────────────────────────────────────────────────
  if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: "Missing required fields (user_id, items)" });
  }
  if (!payment_method) {
    return res.status(400).json({ success: false, error: "Payment method is required" });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const ordersTable = await resolveOrderTable(connection); // ✅ Correct
    const orderColumns = await getTableColumns(connection, ordersTable);
    const itemColumns = await getTableColumns(connection, "order_items");

    let resolvedSellerId = toNumber(seller_id ?? req.body?.sellerId, null);
    if (resolvedSellerId == null) {
      const fromItems = items.find((item) => item?.seller_id != null || item?.sellerId != null);
      resolvedSellerId = toNumber(fromItems?.seller_id ?? fromItems?.sellerId, null);
    }
    if (resolvedSellerId == null) {
      resolvedSellerId = await inferSellerIdFromItems(connection, items);
    }

    const insertCols = [
      "user_id",
      "subtotal",
      "gst",
      "delivery_fee",
      "total_amount",
      "distance_km",
      "delivery_address",
      "custom_note",
      "payment_method",
      "pickup_lat",
      "pickup_lng",
      "pickup_area",
    ];
    const insertVals = [
      user_id,
      subtotal       ?? 0,
      gst            ?? 0,
      delivery_fee   ?? 0,
      total_amount   ?? 0,
      distance_km    ?? null,
      delivery_address ?? null,
      custom_note    ?? null,
      payment_method,
      pickup_lat     ?? null,
      pickup_lng     ?? null,
      pickup_area    ?? null,
    ];

    if (orderColumns.has("seller_id")) {
      insertCols.push("seller_id");
      insertVals.push(resolvedSellerId ?? null);
    }

    // ── 1. Insert order row FIRST ─────────────────────────────────────────
    const [orderResult] = await connection.execute(
      `INSERT INTO ${ordersTable}
        (${insertCols.join(", ")})
       VALUES (${insertCols.map(() => "?").join(", ")})`,
      insertVals
    );

    const order_id = orderResult.insertId; // ← capture the new order's ID

    // ── 2. Insert into order_items using the captured order_id ────────────
    for (const item of items) {
      const itemNameColumn = itemColumns.has("item_name") ? "item_name" : "name";

      const cols = ["order_id", itemNameColumn, "quantity", "price"];
      const vals = [
        order_id,
        item.name ?? "Unknown item",
        item.quantity ?? 1,
        item.price ?? 0,
      ];

      if (itemColumns.has("item_id")) {
        cols.push("item_id");
        vals.push(item.id ?? null);
      }
      if (itemColumns.has("image")) {
        cols.push("image");
        vals.push(item.image ?? null);
      }
      if (itemColumns.has("category")) {
        cols.push("category");
        vals.push(item.category ?? null);
      }
      if (itemColumns.has("seller_id")) {
        cols.push("seller_id");
        vals.push(toNumber(item.seller_id ?? item.sellerId, null) ?? resolvedSellerId ?? null);
      }

      const placeholders = cols.map(() => "?").join(", ");
      await connection.execute(
        `INSERT INTO order_items (${cols.join(", ")}) VALUES (${placeholders})`,
        vals
      );
    }

    await connection.commit();

    return res.json({ success: true, order_id });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Order save error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
});


// GET /api/orders/user/:userId  — fetch orders for profile page
router.get("/user/:userId", async (req, res) => {
  const db = req.app.locals.db;
  let connection;
  try {
    connection = await db.getConnection();
    await ensureOrderReviewsTable(connection);
    const ordersTable = await resolveOrderTable(connection);
    const itemColumns = await getTableColumns(connection, "order_items");
    const itemNameColumn = itemColumns.has("item_name") ? "item_name" : "name";
    const itemImageExpr = itemColumns.has("image") ? "oi.image" : "NULL";
    const itemCategoryExpr = itemColumns.has("category") ? "oi.category" : "NULL";

    const [orders] = await connection.execute(
      `SELECT o.*, o.id AS order_id,
              MAX(rv.rating) AS rating,
              MAX(rv.review_text) AS review_text,
              GROUP_CONCAT(
                JSON_OBJECT(
                  'name',     oi.${itemNameColumn},
                  'price',    oi.price,
                  'quantity', oi.quantity,
                  'image_url', ${itemImageExpr},
                  'category', ${itemCategoryExpr}
                )
              ) AS items_json
       FROM ${ordersTable} o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN order_reviews rv ON rv.order_id = o.id AND rv.user_id = o.user_id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.params.userId]
    );

    const result = orders.map(o => ({
      ...o,
      rating: o.rating == null ? null : Number(o.rating),
      review_text: o.review_text || "",
      items: o.items_json
        ? o.items_json.split("},{").map(s => {
            try { return JSON.parse(s.startsWith("{") ? s : "{" + s); }
            catch { return null; }
          }).filter((item) => item && (item.name || item.price != null || item.quantity != null))
        : [],
    }));

    res.json({ success: true, orders: result });
  } catch (err) {
    console.error("❌ Fetch orders error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/orders/:orderId/tracking
router.get("/:orderId/tracking", async (req, res) => {
  const db = req.app.locals.db;
  let connection;

  try {
    connection = await db.getConnection();
    const ordersTable = await resolveOrderTable(connection);
    const itemColumns = await getTableColumns(connection, "order_items");
    const itemNameColumn = itemColumns.has("item_name") ? "item_name" : "name";

    const [orderRows] = await connection.execute(
      `SELECT * FROM ${ordersTable} WHERE id = ? LIMIT 1`,
      [req.params.orderId]
    );

    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const [items] = await connection.execute(
      `SELECT ${itemNameColumn} AS item_name, quantity, price
       FROM order_items
       WHERE order_id = ?
       ORDER BY id ASC`,
      [req.params.orderId]
    );

    let events = [];
    try {
      const [eventRows] = await connection.execute(
        `SELECT message, created_at
         FROM order_events
         WHERE order_id = ?
         ORDER BY id ASC`,
        [req.params.orderId]
      );
      events = eventRows.map((ev) => ({
        message: ev.message,
        created_at: ev.created_at,
        time_label: formatTimeLabel(ev.created_at),
      }));
    } catch (_) {
      // order_events table is optional in some local setups
    }

    const status = normalizeStatus(order.status);
    const rider = computeSimulatedRider(order, status);
    const etaMinutes = computeEtaMinutes(status, rider, order);
    const cook = status === "confirmed" || status === "cook_found" || status === "preparing"
      ? {
          name: "Home Cook",
          area: order.pickup_area || "Nearby",
          distance_km: Math.max(0.8, toNumber(order.distance_km, 2.4) / 2),
          rating: 4.8,
          total_orders: 200,
        }
      : null;

    const normalizedOrder = {
      ...order,
      order_id: order.id,
      delivery_lat: toNumber(order.delivery_lat ?? order.pickup_lat, null),
      delivery_lng: toNumber(order.delivery_lng ?? order.pickup_lng, null),
      items: (items || []).map((it) => ({
        name: it.item_name,
        quantity: it.quantity,
        price: it.price,
      })),
    };

    if (!events.length) {
      events = buildFallbackEvents(status, order.created_at);
    }

    return res.json({
      success: true,
      order: normalizedOrder,
      status,
      eta_minutes: etaMinutes,
      cook,
      rider,
      events,
    });
  } catch (err) {
    console.error("❌ Tracking fetch error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/orders/:orderId/review?userId=1
router.get("/:orderId/review", async (req, res) => {
  const db = req.app.locals.db;
  let connection;

  try {
    connection = await db.getConnection();
    await ensureOrderReviewsTable(connection);

    const userId = Number(req.query.userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    const [rows] = await connection.execute(
      `SELECT order_id, user_id, rating, review_text, created_at, updated_at
       FROM order_reviews
       WHERE order_id = ? AND user_id = ?
       LIMIT 1`,
      [req.params.orderId, userId]
    );

    return res.json({ success: true, review: rows[0] || null });
  } catch (err) {
    console.error("❌ Review fetch error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// POST /api/orders/:orderId/review
router.post("/:orderId/review", async (req, res) => {
  const db = req.app.locals.db;
  let connection;

  try {
    connection = await db.getConnection();
    await ensureOrderReviewsTable(connection);

    const orderId = Number(req.params.orderId);
    const userId = Number(req.body?.user_id);
    const rating = Math.round(Number(req.body?.rating));
    const reviewText = String(req.body?.review_text || "").trim();

    if (!Number.isFinite(orderId) || orderId <= 0) {
      return res.status(400).json({ success: false, error: "Invalid order id" });
    }
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ success: false, error: "user_id is required" });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: "rating must be between 1 and 5" });
    }

    const ordersTable = await resolveOrderTable(connection);
    const [orderRows] = await connection.execute(
      `SELECT id, user_id, status FROM ${ordersTable} WHERE id = ? LIMIT 1`,
      [orderId]
    );

    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    if (Number(order.user_id) !== userId) {
      return res.status(403).json({ success: false, error: "You can review only your own orders" });
    }

    const normalizedStatus = normalizeStatus(order.status);
    if (normalizedStatus !== "delivered") {
      return res.status(400).json({ success: false, error: "Only delivered orders can be reviewed" });
    }

    await connection.execute(
      `INSERT INTO order_reviews (order_id, user_id, rating, review_text)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         rating = VALUES(rating),
         review_text = VALUES(review_text),
         updated_at = CURRENT_TIMESTAMP`,
      [orderId, userId, rating, reviewText || null]
    );

    const [rows] = await connection.execute(
      `SELECT order_id, user_id, rating, review_text, created_at, updated_at
       FROM order_reviews
       WHERE order_id = ? AND user_id = ?
       LIMIT 1`,
      [orderId, userId]
    );

    return res.json({ success: true, review: rows[0] || null });
  } catch (err) {
    console.error("❌ Review save error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;