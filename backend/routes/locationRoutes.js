// routes/locationRoutes.js — FreshBite Location & Seller Matching

const express = require("express");
const router  = express.Router();
const db      = require("../db");

// ── Haversine formula (returns distance in km) ──────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── POST /api/location/nearest-sellers ─────────────────────────
// Body: { latitude, longitude, radius_km (optional), area (optional), dish_ids (optional) }
// Strategy: GPS radius first → if no results, fallback to area text match
router.post("/nearest-sellers", async (req, res) => {
  const { latitude, longitude, radius_km = 10, area, dish_ids } = req.body;

  const hasGPS  = latitude != null && longitude != null;
  const hasArea = area && area.trim().length > 0;

  if (!hasGPS && !hasArea)
    return res.status(400).json({ error: "Provide latitude/longitude or area name" });

  try {
    // Fetch all sellers with location data
    const [sellers] = await db.execute(
      `SELECT s.id, s.name, s.area, s.city, s.latitude, s.longitude,
              s.profile_image, s.rating, s.is_active
       FROM sellers s
       WHERE s.is_active = 1`
    );

    let matched = [];

    // ── Strategy 1: GPS radius match ───────────────────────────
    if (hasGPS) {
      matched = sellers
        .filter(s => s.latitude != null && s.longitude != null)
        .map(s => ({
          ...s,
          distance_km: +haversineDistance(latitude, longitude, s.latitude, s.longitude).toFixed(2),
          match_type: "gps"
        }))
        .filter(s => s.distance_km <= radius_km)
        .sort((a, b) => a.distance_km - b.distance_km);
    }

    // ── Strategy 2: Area text fallback ─────────────────────────
    if (matched.length === 0 && hasArea) {
      const areaLower = area.toLowerCase();
      matched = sellers
        .filter(s =>
          (s.area  && s.area.toLowerCase().includes(areaLower)) ||
          (s.city  && s.city.toLowerCase().includes(areaLower))
        )
        .map(s => ({ ...s, distance_km: null, match_type: "area" }));
    }

    if (matched.length === 0)
      return res.json({ success: true, sellers: [], message: "No sellers found nearby" });

    // ── Optionally filter by dish availability ─────────────────
    if (dish_ids && dish_ids.length > 0) {
      const sellerIds = matched.map(s => s.id);
      const placeholders = sellerIds.map(() => "?").join(",");
      const dishPlaceholders = dish_ids.map(() => "?").join(",");

      const [menuItems] = await db.execute(
        `SELECT DISTINCT seller_id FROM menu_items
         WHERE seller_id IN (${placeholders})
           AND id IN (${dishPlaceholders})
           AND is_available = 1`,
        [...sellerIds, ...dish_ids]
      );

      const sellerIdsWithDish = new Set(menuItems.map(m => m.seller_id));
      matched = matched.filter(s => sellerIdsWithDish.has(s.id));
    }

    res.json({ success: true, sellers: matched, total: matched.length });
  } catch (err) {
    console.error("Nearest sellers error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// ── POST /api/location/save-user-location ──────────────────────
// Saves or updates a user's delivery location
router.post("/save-user-location", async (req, res) => {
  const { user_id, latitude, longitude, address, area, city } = req.body;

  if (!user_id)
    return res.status(400).json({ error: "user_id is required" });

  try {
    await db.execute(
      `INSERT INTO user_locations (user_id, latitude, longitude, address, area, city)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         latitude = VALUES(latitude),
         longitude = VALUES(longitude),
         address = VALUES(address),
         area = VALUES(area),
         city = VALUES(city),
         updated_at = NOW()`,
      [user_id, latitude || null, longitude || null, address || null, area || null, city || null]
    );
    res.json({ success: true, message: "Location saved" });
  } catch (err) {
    console.error("Save location error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// ── GET /api/location/user-location/:userId ────────────────────
router.get("/user-location/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT * FROM user_locations WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    if (rows.length === 0)
      return res.json({ success: true, location: null });
    res.json({ success: true, location: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;