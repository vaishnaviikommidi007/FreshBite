const express = require('express');
const router = express.Router();
const db = require('../db'); // your existing db.js

// POST /api/cart/save — Save full cart to MySQL
router.post('/save', async (req, res) => {
  const { user_id, items, total_amount } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  try {
    // 1. Insert the order
    const [orderResult] = await db.execute(
      'INSERT INTO cart_orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [user_id || 1, total_amount, 'pending']
    );
    const orderId = orderResult.insertId;

    // 2. Insert each item
    for (const item of items) {
      await db.execute(
        'INSERT INTO cart_order_items (order_id, item_name, category, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.name, item.category || '', item.price, item.quantity, item.image || '']
      );
    }

    res.json({ success: true, orderId, message: 'Cart saved successfully!' });
  } catch (err) {
    console.error('Save cart error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/cart/:userId — Fetch saved orders for a user
router.get('/:userId', async (req, res) => {
  try {
    const [orders] = await db.execute(
      'SELECT * FROM cart_orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.userId]
    );

    for (const order of orders) {
      const [items] = await db.execute(
        'SELECT * FROM cart_order_items WHERE order_id = ?',
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;