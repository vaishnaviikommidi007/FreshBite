const express = require("express");
const router = express.Router();
const db = require("../db");

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

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.execute(
      "SELECT * FROM sellers WHERE email = ? AND password = ?", [email, password]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid email or password." });
    const { password: _pw, ...sellerData } = rows[0];
    res.json({ success: true, sellerId: rows[0].id, sellerName: rows[0].kitchen_name, seller: sellerData });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

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

router.get("/:id/menu", async (req, res) => {
  try {
    const [items] = await db.execute(
      "SELECT * FROM seller_menu WHERE seller_id=? ORDER BY category, name", [req.params.id]);
    res.json(items);
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

router.put("/:id/menu/:itemId", async (req, res) => {
  const { name, category, price, description, is_veg, is_available } = req.body;
  try {
    await db.execute(
      `UPDATE seller_menu SET name=?,category=?,price=?,description=?,is_veg=?,is_available=?
       WHERE id=? AND seller_id=?`,
      [name, category, price, description, is_veg?1:0, is_available?1:0,
       req.params.itemId, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

router.delete("/:id/menu/:itemId", async (req, res) => {
  try {
    await db.execute("DELETE FROM seller_menu WHERE id=? AND seller_id=?",
      [req.params.itemId, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id,name,kitchen_name,email,phone,bio,lat,lng,address,is_active,created_at FROM sellers WHERE id=?",
      [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Seller not found" });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

router.put("/:id", async (req, res) => {
  const { name, kitchenName, phone, bio, address } = req.body;
  try {
    await db.execute(
      "UPDATE sellers SET name=?,kitchen_name=?,phone=?,bio=?,address=? WHERE id=?",
      [name, kitchenName, phone, bio, address, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id,name,kitchen_name,address,lat,lng FROM sellers WHERE is_active=1");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

router.get("/:id/discount", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM seller_discounts WHERE seller_id=?", [req.params.id]);
    if (rows.length === 0) return res.json({ enabled: false });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

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

router.get("/:id/orders", async (req, res) => {
  try {
    const [orders] = await db.execute(
      `SELECT co.*, (SELECT COUNT(*) FROM cart_orders 
       WHERE user_id=co.user_id AND seller_id=co.seller_id AND id<co.id)=0 AS is_first_order
       FROM cart_orders co WHERE co.seller_id=? ORDER BY co.created_at DESC`,
      [req.params.id]);
    for (const order of orders) {
      const [items] = await db.execute(
        "SELECT * FROM cart_order_items WHERE order_id=?", [order.id]);
      order.items = items.length;
    }
    res.json(orders);
  } catch (err) { res.status(500).json({ error: "Database error", detail: err.message }); }
});

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