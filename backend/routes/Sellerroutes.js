const express = require("express");
const router = express.Router();
const db = require("../db");

async function resolveOrderTable(connection) {
  const [tables] = await connection.query("SHOW TABLES");
  const key = tables.length ? Object.keys(tables[0])[0] : null;
  const names = new Set((tables || []).map((row) => row[key]));

  if (names.has("orders_new")) return "orders_new";
  if (names.has("order_new")) return "order_new";
  return "orders";
}

async function getTableColumns(connection, tableName) {
  const [cols] = await connection.query(`SHOW COLUMNS FROM ${tableName}`);
  return new Set(cols.map((c) => c.Field));
}

// POST /api/sellers/register — Step 1
router.post("/register", async (req, res) => {
  const { name, kitchenName, email, password, phone, bio } = req.body;
  if (!name || !kitchenName || !email || !password || !phone)
    return res.status(400).json({ error: "All required fields must be filled." });
  try {
    const [existing] = await db.execute("SELECT id FROM sellers WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.status(400).json({ error: "Email already registered. Please login." });
    const [result] = await db.execute(
      `INSERT INTO sellers (name, kitchen_name, email, password, phone, bio) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, kitchenName, email, password, phone, bio || ""]
    );
    res.json({ success: true, sellerId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Database error", detail: err.message });
  }
});

// POST /api/sellers/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.execute(
      "SELECT * FROM sellers WHERE email = ? AND password = ?", [email, password]
    );
    if (rows.length === 0) return res.status(401).json({ error: "Invalid email or password." });
    res.json({ success: true, sellerId: rows[0].id, sellerName: rows[0].kitchen_name, seller: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// PUT /api/sellers/:id/location — Step 2
router.put("/:id/location", async (req, res) => {
  const { lat, lng, address } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: "Latitude and longitude required." });
  try {
    await db.execute("UPDATE sellers SET lat=?, lng=?, address=? WHERE id=?",
      [lat, lng, address || "", req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error", detail: err.message });
  }
});

// POST /api/sellers/:id/menu — Step 3
router.post("/:id/menu", async (req, res) => {
  const { items } = req.body;
  const sellerId = req.params.id;
  if (!items || items.length === 0)
    return res.status(400).json({ error: "At least one menu item required." });
  try {
    for (const item of items) {
      if (!item.name || !item.price) continue;
      await db.execute(
        `INSERT INTO seller_menu (seller_id, name, category, price, description, is_veg, is_available)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [sellerId, item.name, item.category || "Lunch", parseFloat(item.price),
         item.desc || "", item.veg ? 1 : 0, 1]
      );
    }
    await db.execute("UPDATE sellers SET is_active=1 WHERE id=?", [sellerId]);
    res.json({ success: true, message: "Menu saved! Kitchen is now live." });
  } catch (err) {
    res.status(500).json({ error: "Database error", detail: err.message });
  }
});

// GET /api/sellers/:id/menu
router.get("/:id/menu", async (req, res) => {
  try {
    const [items] = await db.execute(
      "SELECT * FROM seller_menu WHERE seller_id=? ORDER BY category, name", [req.params.id]);
    res.json(items);
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

// PUT /api/sellers/:id/menu/:itemId
router.put("/:id/menu/:itemId", async (req, res) => {
  const { name, category, price, description, is_veg, is_available } = req.body;
  try {
    await db.execute(
      `UPDATE seller_menu SET name=?,category=?,price=?,description=?,is_veg=?,is_available=?
       WHERE id=? AND seller_id=?`,
      [name, category, price, description, is_veg?1:0, is_available?1:0, req.params.itemId, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

// DELETE /api/sellers/:id/menu/:itemId
router.delete("/:id/menu/:itemId", async (req, res) => {
  try {
    await db.execute("DELETE FROM seller_menu WHERE id=? AND seller_id=?",
      [req.params.itemId, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

// GET /api/sellers/:id — full profile
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id,name,kitchen_name,email,phone,bio,lat,lng,address,is_active,created_at FROM sellers WHERE id=?",
      [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Seller not found" });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

// PUT /api/sellers/:id — update profile
router.put("/:id", async (req, res) => {
  const { name, kitchenName, phone, bio, address } = req.body;
  try {
    await db.execute(
      "UPDATE sellers SET name=?,kitchen_name=?,phone=?,bio=?,address=? WHERE id=?",
      [name, kitchenName, phone, bio, address, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

// GET /api/sellers — all active sellers
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id,name,kitchen_name,address,lat,lng FROM sellers WHERE is_active=1");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

// GET /api/sellers/:id/discount
router.get("/:id/discount", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM seller_discounts WHERE seller_id=?", [req.params.id]);
    if (rows.length === 0) return res.json({ enabled: false });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

// POST /api/sellers/:id/discount
router.post("/:id/discount", async (req, res) => {
  const { enabled, type, value, min_order, code } = req.body;
  const sellerId = req.params.id;
  try {
    const [existing] = await db.execute(
      "SELECT id FROM seller_discounts WHERE seller_id=?", [sellerId]);
    if (existing.length > 0) {
      await db.execute(
        "UPDATE seller_discounts SET enabled=?,type=?,value=?,min_order=?,code=? WHERE seller_id=?",
        [enabled?1:0, type, value, min_order, code, sellerId]);
    } else {
      await db.execute(
        "INSERT INTO seller_discounts (seller_id,enabled,type,value,min_order,code) VALUES (?,?,?,?,?,?)",
        [sellerId, enabled?1:0, type, value, min_order, code]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Database error", detail: err.message }); }
});

// GET /api/sellers/:id/orders
router.get("/:id/orders", async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    const sellerId = Number(req.params.id);
    const ordersTable = await resolveOrderTable(connection);
    const orderColumns = await getTableColumns(connection, ordersTable);
    const itemColumns = await getTableColumns(connection, "order_items");
    const itemNameColumn = itemColumns.has("item_name") ? "item_name" : "name";

    let orders = [];

    if (orderColumns.has("seller_id")) {
      const [rows] = await connection.execute(
        `SELECT o.id,
                o.user_id,
                o.total_amount,
                o.status,
                o.created_at,
                COUNT(oi.id) AS items,
                (
                  SELECT COUNT(*)
                  FROM ${ordersTable} oo
                  WHERE oo.user_id = o.user_id AND oo.seller_id = o.seller_id AND oo.id < o.id
                ) = 0 AS is_first_order
         FROM ${ordersTable} o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.seller_id = ?
         GROUP BY o.id
         ORDER BY o.created_at DESC`,
        [sellerId]
      );
      orders = rows;
    } else if (itemColumns.has("seller_id")) {
      const [rows] = await connection.execute(
        `SELECT o.id,
                o.user_id,
                o.total_amount,
                o.status,
                o.created_at,
                COUNT(oi.id) AS items
         FROM ${ordersTable} o
         JOIN order_items oi ON oi.order_id = o.id
         WHERE oi.seller_id = ?
         GROUP BY o.id
         ORDER BY o.created_at DESC`,
        [sellerId]
      );

      const seenUsers = new Set();
      orders = rows.map((row) => {
        const isFirst = !seenUsers.has(row.user_id);
        seenUsers.add(row.user_id);
        return { ...row, is_first_order: isFirst ? 1 : 0 };
      });
    } else {
      // Legacy fallback for older cart schema
      const [rows] = await connection.execute(
        `SELECT co.*, (SELECT COUNT(*) FROM cart_orders
         WHERE user_id=co.user_id AND seller_id=co.seller_id AND id<co.id)=0 AS is_first_order
         FROM cart_orders co WHERE co.seller_id=? ORDER BY co.created_at DESC`,
        [sellerId]
      );
      orders = rows;

      for (const order of orders) {
        const [items] = await connection.execute(
          "SELECT * FROM cart_order_items WHERE order_id=?", [order.id]
        );
        order.items = items.length;
      }
    }

    // Try to enrich buyer names when users table exists
    const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))];
    const buyerNameByUserId = new Map();
    if (userIds.length > 0) {
      try {
        const placeholders = userIds.map(() => "?").join(",");
        const [users] = await connection.execute(
          `SELECT id, name FROM users WHERE id IN (${placeholders})`,
          userIds
        );
        users.forEach((u) => buyerNameByUserId.set(u.id, u.name));
      } catch (_) {
        // users table may not exist in all setups
      }
    }

    orders = orders.map((o) => ({
      ...o,
      buyer_name: buyerNameByUserId.get(o.user_id) || o.buyer_name || null,
    }));

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Database error", detail: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/sellers/:id/check-first-order?user_id=X
router.get("/:id/check-first-order", async (req, res) => {
  const { user_id } = req.query;
  try {
    const [rows] = await db.execute(
      "SELECT COUNT(*) as count FROM cart_orders WHERE seller_id=? AND user_id=?",
      [req.params.id, user_id]);
    const isFirst = rows[0].count === 0;
    if (isFirst) {
      const [discount] = await db.execute(
        "SELECT * FROM seller_discounts WHERE seller_id=? AND enabled=1", [req.params.id]);
      res.json({ isFirstOrder: true, discount: discount[0] || null });
    } else {
      res.json({ isFirstOrder: false, discount: null });
    }
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

module.exports = router;