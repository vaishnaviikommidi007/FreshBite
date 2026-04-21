// server.js  — FreshBite Backend
const express = require("express");
const cors    = require("cors");
const db      = require("./db");

const app  = express();
const PORT = 5000;

// ─── Middleware ─────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// ─── Attach db to app.locals ─────────────────────────────────────
app.locals.db = db; // ✅ REQUIRED for Ordersroute.js

// ─── Route Imports ──────────────────────────────────────────────
const authRoutes     = require("./routes/auth");
const cartRoutes     = require("./routes/cartRoutes");
const sellerRoutes   = require("./routes/Sellerroutes");
const locationRoutes = require("./routes/locationRoutes");
const orderRoutes    = require("./routes/Ordersroute");

// ─── Route Registration ─────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/cart",     cartRoutes);
app.use("/api/sellers",  sellerRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/orders",   orderRoutes); // ✅ Ordersroute.js handles everything

// ── Health check ────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ status: "ok", server: "FreshBite API" }));

// ─── Start server ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 FreshBite server running at http://localhost:${PORT}`);
});
