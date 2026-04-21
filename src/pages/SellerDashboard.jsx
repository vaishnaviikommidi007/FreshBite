import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";
const FOOD_CATEGORIES = ["Breakfast","Lunch","Dinner","Snacks","Sweets","Drinks","Biryani","South Indian","North Indian","Chinese","Healthy"];

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{
      background: "white", borderRadius: "20px", padding: "22px 24px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.07)", flex: 1, minWidth: "160px",
      borderTop: `4px solid ${color}`, transition: "transform 0.2s", cursor: "default"
    }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{ fontSize: "28px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "26px", fontWeight: 800, color: "#1a1a1a" }}>{value}</div>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "#555", marginTop: "2px" }}>{label}</div>
      {sub && <div style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const sellerId = localStorage.getItem("sellerId");

  const [tab, setTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, revenue: 0, firstOrders: 0, avgOrder: 0 });
  const [loading, setLoading] = useState(true);

  // Discount state
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState(10);
  const [discountMin, setDiscountMin] = useState(0);
  const [discountCode, setDiscountCode] = useState("FIRST10");
  const [discountSaved, setDiscountSaved] = useState(false);
  const [savingDiscount, setSavingDiscount] = useState(false);

  // Settings state
  const [sellerInfo, setSellerInfo] = useState({ name: "", kitchenName: "", phone: "", bio: "", address: "" });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // New menu item
  const [newItem, setNewItem] = useState({ name: "", category: "Lunch", price: "", desc: "", veg: true });
  const [addingItem, setAddingItem] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!sellerId) {
      navigate("/seller/login");
      return;
    }
    fetchOrders();
    fetchDiscount();
    fetchMenu();
    fetchSellerInfo();
  }, [sellerId, navigate]);

  if (!sellerId) {
    return null;
  }

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sellers/${sellerId}/orders`);
      const data = await res.json();
      const ordersData = Array.isArray(data) ? data : [];
      setOrders(ordersData);

      const total = ordersData.length;
      const revenue = ordersData.reduce((s, o) => s + Number(o.total_amount || 0), 0);
      const firstOrders = ordersData.filter(o => o.is_first_order).length;
      setStats({
        total,
        revenue: revenue.toFixed(0),
        firstOrders,
        avgOrder: total > 0 ? (revenue / total).toFixed(0) : 0,
      });
    } catch {
      setOrders([]);
      setStats({ total: 0, revenue: 0, firstOrders: 0, avgOrder: 0 });
      showToast("Could not fetch live orders.", "error");
    }
    setLoading(false);
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE}/sellers/${sellerId}/menu`);
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch { setMenuItems([]); }
  };

  const fetchDiscount = async () => {
    try {
      const res = await fetch(`${API_BASE}/sellers/${sellerId}/discount`);
      const data = await res.json();
      if (data && data.enabled !== undefined) {
        setDiscountEnabled(!!data.enabled);
        setDiscountType(data.type || "percent");
        setDiscountValue(data.value || 10);
        setDiscountMin(data.min_order || 0);
        setDiscountCode(data.code || "FIRST10");
      }
    } catch {}
  };

  const fetchSellerInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/sellers/${sellerId}`);
      const data = await res.json();
      if (data) setSellerInfo({ name: data.name || "", kitchenName: data.kitchen_name || "", phone: data.phone || "", bio: data.bio || "", address: data.address || "" });
    } catch {}
  };

  const saveDiscount = async () => {
    setSavingDiscount(true);
    try {
      await fetch(`${API_BASE}/sellers/${sellerId}/discount`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: discountEnabled, type: discountType, value: discountValue, min_order: discountMin, code: discountCode })
      });
    } catch {}
    setSavingDiscount(false);
    setDiscountSaved(true);
    showToast("Discount settings saved! 🎉");
    setTimeout(() => setDiscountSaved(false), 2500);
  };

  const saveSettings = async () => {
    try {
      await fetch(`${API_BASE}/sellers/${sellerId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sellerInfo)
      });
    } catch {}
    localStorage.setItem("sellerName", sellerInfo.kitchenName || sellerInfo.name);
    setSettingsSaved(true);
    showToast("Settings saved!");
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price) { showToast("Please enter dish name and price", "error"); return; }
    setAddingItem(true);
    try {
      const res = await fetch(`${API_BASE}/sellers/${sellerId}/menu`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [newItem] })
      });
      if (res.ok) { await fetchMenu(); setNewItem({ name: "", category: "Lunch", price: "", desc: "", veg: true }); showToast("Dish added! 🍱"); }
    } catch { showToast("Failed to add dish", "error"); }
    setAddingItem(false);
  };

  const toggleAvailability = async (item) => {
    try {
      await fetch(`${API_BASE}/sellers/${sellerId}/menu/${item.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, is_available: !item.is_available })
      });
      fetchMenu();
    } catch {}
  };

  const deleteMenuItem = async (itemId) => {
    try {
      await fetch(`${API_BASE}/sellers/${sellerId}/menu/${itemId}`, { method: "DELETE" });
      fetchMenu(); showToast("Dish removed");
    } catch {}
  };

  const accent = "#f97316";
  const green = "#22c55e";
  const statusColor = { delivered: "#22c55e", pending: "#f97316", preparing: "#667eea", cancelled: "#e8534a" };
  const statusBg = { delivered: "#f0fdf4", pending: "#fff7ed", preparing: "#eef2ff", cancelled: "#fff5f5" };
  const deliveredCount = orders.filter(o => o.status === "delivered").length;
  const pendingCount = orders.filter(o => o.status === "pending" || o.status === "preparing").length;
  const cancelledCount = orders.filter(o => o.status === "cancelled").length;

  const tabStyle = (t) => ({
    padding: "9px 16px", borderRadius: "30px", border: "none",
    fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "12px",
    cursor: "pointer", transition: "all 0.2s",
    background: tab === t ? accent : "white",
    color: tab === t ? "white" : "#555",
    boxShadow: tab === t ? `0 4px 14px rgba(249,115,22,0.3)` : "0 2px 8px rgba(0,0,0,0.06)"
  });

  const inp = (extra = {}) => ({
    width: "100%", padding: "11px 14px", borderRadius: "10px",
    border: "1.5px solid #e8e8e8", fontSize: "13px",
    fontFamily: "Sora, sans-serif", outline: "none",
    background: "white", boxSizing: "border-box", ...extra
  });

  const sellerDisplayName = localStorage.getItem("sellerName") || sellerInfo.kitchenName || "Seller";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #f8f4f2; font-family: 'Sora', sans-serif; }
        .toggle-switch { position: relative; width: 52px; height: 28px; cursor: pointer; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; inset: 0; background: #ddd; border-radius: 34px; transition: 0.3s; }
        .toggle-slider:before { content: ""; position: absolute; height: 20px; width: 20px; left: 4px; bottom: 4px; background: white; border-radius: 50%; transition: 0.3s; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
        input:checked + .toggle-slider { background: #22c55e; }
        input:checked + .toggle-slider:before { transform: translateX(24px); }
        .dash-card { background: white; border-radius: 20px; padding: 22px 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 16px; }
        .dash-card-title { font-weight: 700; font-size: 15px; color: #1a1a1a; margin-bottom: 16px; }
        .menu-item-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #f5f5f5; }
        .menu-item-row:last-child { border-bottom: none; }
        .order-row:hover { background: #fafafa; }
        .discount-preview { background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 20px; padding: 24px 28px; color: white; position: relative; overflow: hidden; }
        .discount-preview::before { content: ''; position: absolute; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,0.08); top: -60px; right: -60px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.35s ease; }
        .toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); padding: 12px 28px; border-radius: 30px; font-weight: 700; font-size: 14px; z-index: 9999; box-shadow: 0 8px 30px rgba(0,0,0,0.15); animation: fadeIn 0.3s ease; font-family: 'Sora', sans-serif; }
        .toast-success { background: #22c55e; color: white; }
        .toast-error { background: #e8534a; color: white; }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23999' d='M6 8L0 0h12z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px !important; }
        textarea { resize: vertical; }
      `}</style>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      {/* NAV */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "64px", background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", zIndex: 1000, boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #f97316, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🏠</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "15px", color: "#1a1a1a" }}>Fresh<span style={{ color: accent }}>Bite</span> Seller</div>
            <div style={{ fontSize: "11px", color: "#aaa" }}>{sellerDisplayName}'s Kitchen</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          {[["overview","📊 Overview"],["menu","🍱 Menu"],["discount","🎁 Discount"],["orders","📦 Orders"],["settings","⚙️ Settings"]].map(([t, label]) => (
            <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>{label}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => navigate("/")} style={{ padding: "8px 14px", borderRadius: "20px", border: "1.5px solid #e8e8e8", background: "white", color: "#555", fontWeight: 600, fontSize: "12px", cursor: "pointer", fontFamily: "Sora, sans-serif" }}>🏠 Home</button>
          <button onClick={() => { localStorage.removeItem("sellerId"); localStorage.removeItem("sellerName"); navigate("/"); }} style={{ padding: "8px 14px", borderRadius: "20px", border: "1.5px solid #fecaca", background: "white", color: "#e8534a", fontWeight: 600, fontSize: "12px", cursor: "pointer", fontFamily: "Sora, sans-serif" }}>Logout</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ paddingTop: "84px", maxWidth: "1000px", margin: "0 auto", padding: "84px 24px 60px" }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="fade-in">
            <h2 style={{ margin: "0 0 4px", fontSize: "24px", color: "#1a1a1a" }}>Good day, {sellerDisplayName}! 👋</h2>
            <p style={{ color: "#999", fontSize: "14px", margin: "0 0 24px" }}>Here's how your kitchen is performing</p>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "24px" }}>
              <StatCard icon="📦" label="Total Orders" value={stats.total} color={accent} />
              <StatCard icon="💰" label="Revenue" value={`₹${stats.revenue}`} color="#f97316" />
              <StatCard icon="✅" label="Delivered" value={deliveredCount} color={green} />
              <StatCard icon="📈" label="Avg Order" value={`₹${stats.avgOrder}`} sub={`${pendingCount} live · ${cancelledCount} cancelled`} color="#667eea" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
              <div className="dash-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>🎁 First Order Discount</div>
                  <div style={{ fontSize: "12px", color: "#aaa", marginTop: "3px" }}>{discountEnabled ? `${discountType === "percent" ? `${discountValue}% off` : `₹${discountValue} off`} · Active` : "Not active"}</div>
                </div>
                <button onClick={() => setTab("discount")} style={{ padding: "7px 14px", borderRadius: "20px", border: "none", background: "linear-gradient(135deg, #f97316, #ea580c)", color: "white", fontWeight: 700, fontSize: "12px", cursor: "pointer", fontFamily: "Sora, sans-serif" }}>Manage →</button>
              </div>
              <div className="dash-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>🍱 My Menu</div>
                  <div style={{ fontSize: "12px", color: "#aaa", marginTop: "3px" }}>{menuItems.length} dishes · {menuItems.filter(m => m.is_available).length} available</div>
                </div>
                <button onClick={() => setTab("menu")} style={{ padding: "7px 14px", borderRadius: "20px", border: "none", background: "linear-gradient(135deg, #f97316, #ea580c)", color: "white", fontWeight: 700, fontSize: "12px", cursor: "pointer", fontFamily: "Sora, sans-serif" }}>Manage →</button>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-card-title">Recent Orders</div>
              {orders.slice(0, 4).map((o, i) => (
                <div key={i} className="order-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 3 ? "1px solid #f5f5f5" : "none" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>{o.buyer_name || `Order #${o.id}`}</div>
                    <div style={{ fontSize: "12px", color: "#aaa" }}>{o.created_at} · {o.items} items</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {o.is_first_order && <span style={{ fontSize: "10px", background: "#fff7ed", color: "#f97316", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>1st</span>}
                    <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "10px", fontWeight: 700, background: statusBg[o.status] || "#f5f5f5", color: statusColor[o.status] || "#555" }}>{o.status}</span>
                    <span style={{ fontWeight: 700, color: accent }}>₹{o.total_amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MENU ── */}
        {tab === "menu" && (
          <div className="fade-in">
            <h2 style={{ margin: "0 0 4px", fontSize: "24px", color: "#1a1a1a" }}>🍱 My Menu</h2>
            <p style={{ color: "#999", fontSize: "14px", margin: "0 0 20px" }}>{menuItems.length} dishes</p>
            <div className="dash-card">
              <div className="dash-card-title">➕ Add New Dish</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px" }}>DISH NAME *</label>
                  <input style={inp()} placeholder="e.g. Chicken Biryani" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px" }}>PRICE (₹) *</label>
                  <input style={inp()} type="number" placeholder="150" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px" }}>CATEGORY</label>
                  <select style={inp()} value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
                    {FOOD_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px" }}>TYPE</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[["🟢 Veg", true], ["🔴 Non-Veg", false]].map(([label, val]) => (
                      <button key={label} onClick={() => setNewItem(p => ({ ...p, veg: val }))} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: `1.5px solid ${newItem.veg === val ? (val ? "#22c55e" : "#e8534a") : "#e8e8e8"}`, background: newItem.veg === val ? (val ? "#f0fdf4" : "#fff5f5") : "white", color: newItem.veg === val ? (val ? "#22c55e" : "#e8534a") : "#555", fontWeight: 700, fontSize: "12px", cursor: "pointer", fontFamily: "Sora, sans-serif" }}>{label}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px" }}>DESCRIPTION</label>
                <input style={inp()} placeholder="Short description..." value={newItem.desc} onChange={e => setNewItem(p => ({ ...p, desc: e.target.value }))} />
              </div>
              <button onClick={addMenuItem} disabled={addingItem} style={{ padding: "12px 24px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #f97316, #ea580c)", color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "Sora, sans-serif", boxShadow: "0 4px 14px rgba(249,115,22,0.3)" }}>
                {addingItem ? "Adding..." : "➕ Add Dish"}
              </button>
            </div>
            <div className="dash-card">
              <div className="dash-card-title">Your Dishes ({menuItems.length})</div>
              {menuItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>🍱</div>No dishes yet. Add above!
                </div>
              ) : menuItems.map((item, i) => (
                <div key={item.id || i} className="menu-item-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: item.is_veg ? "#f0fdf4" : "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>{item.is_veg ? "🟢" : "🔴"}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "#1a1a1a" }}>{item.name}</div>
                      <div style={{ fontSize: "11px", color: "#aaa" }}>{item.category} · {item.description || "No description"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: 800, color: accent }}>₹{item.price}</span>
                    <button onClick={() => toggleAvailability(item)} style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, cursor: "pointer", border: "none", fontFamily: "Sora, sans-serif", background: item.is_available ? "#f0fdf4" : "#f5f5f5", color: item.is_available ? "#22c55e" : "#aaa" }}>
                      {item.is_available ? "✓ Available" : "✗ Off"}
                    </button>
                    <button onClick={() => deleteMenuItem(item.id)} style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#fff5f5", border: "none", color: "#e8534a", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DISCOUNT ── */}
        {tab === "discount" && (
          <div className="fade-in">
            <h2 style={{ margin: "0 0 4px", fontSize: "24px", color: "#1a1a1a" }}>🎁 First Order Discount</h2>
            <p style={{ color: "#999", fontSize: "14px", margin: "0 0 24px" }}>Attract new customers with a special first order offer</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="dash-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }}>
                  <div><div style={{ fontWeight: 700 }}>Enable Discount</div><div style={{ fontSize: "12px", color: "#aaa", marginTop: "3px" }}>Show offer to first-time buyers</div></div>
                  <label className="toggle-switch"><input type="checkbox" checked={discountEnabled} onChange={e => setDiscountEnabled(e.target.checked)} /><span className="toggle-slider"></span></label>
                </div>
                <div className="dash-card" style={{ marginBottom: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "12px" }}>Discount Type</div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {[["percent", "% Percentage"], ["flat", "₹ Flat Amount"]].map(([val, label]) => (
                      <button key={val} onClick={() => setDiscountType(val)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: `2px solid ${discountType === val ? accent : "#e8e8e8"}`, background: discountType === val ? "#fff7ed" : "white", color: discountType === val ? accent : "#555", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "Sora, sans-serif" }}>{label}</button>
                    ))}
                  </div>
                </div>
                <div className="dash-card" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: "14px", display: "block", marginBottom: "10px" }}>Discount Value</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "#aaa" }}>{discountType === "percent" ? "%" : "₹"}</span>
                    <input type="number" value={discountValue} min={1} onChange={e => setDiscountValue(Number(e.target.value))} style={{ ...inp(), fontSize: "22px", fontWeight: 800, color: accent, width: "100px" }} />
                  </div>
                </div>
                <div className="dash-card" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: "14px", display: "block", marginBottom: "10px" }}>Min. Order (₹)</label>
                  <input type="number" value={discountMin} min={0} onChange={e => setDiscountMin(Number(e.target.value))} placeholder="0 = no minimum" style={inp()} />
                </div>
                <div className="dash-card" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: "14px", display: "block", marginBottom: "10px" }}>Promo Code</label>
                  <input value={discountCode} onChange={e => setDiscountCode(e.target.value.toUpperCase())} style={{ ...inp(), textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700 }} />
                </div>
                <button onClick={saveDiscount} disabled={savingDiscount} style={{ padding: "14px", borderRadius: "14px", border: "none", background: discountSaved ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #f97316, #ea580c)", color: "white", fontWeight: 800, fontSize: "15px", cursor: "pointer", fontFamily: "Sora, sans-serif", transition: "all 0.3s" }}>
                  {savingDiscount ? "Saving..." : discountSaved ? "✓ Saved!" : "💾 Save Discount"}
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "1px" }}>Preview — what buyers see</div>
                <div className="discount-preview">
                  <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.8, marginBottom: "6px", position: "relative", zIndex: 1 }}>🎉 FIRST ORDER OFFER</div>
                  <div style={{ fontSize: "36px", fontWeight: 800, position: "relative", zIndex: 1, lineHeight: 1 }}>{discountEnabled ? (discountType === "percent" ? `${discountValue}% OFF` : `₹${discountValue} OFF`) : "No Discount"}</div>
                  <div style={{ fontSize: "13px", opacity: 0.85, marginTop: "6px", position: "relative", zIndex: 1 }}>{discountEnabled ? (discountMin > 0 ? `On orders above ₹${discountMin}` : "On your very first order!") : "Discount is disabled"}</div>
                  {discountEnabled && discountCode && <div style={{ marginTop: "14px", display: "inline-block", background: "rgba(255,255,255,0.2)", borderRadius: "8px", padding: "6px 16px", fontWeight: 800, letterSpacing: "3px", fontSize: "14px", position: "relative", zIndex: 1, border: "1.5px dashed rgba(255,255,255,0.5)" }}>{discountCode}</div>}
                </div>
                <div style={{ background: "#fffbeb", borderRadius: "20px", padding: "20px", border: "1px solid #fde68a" }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#92400e", marginBottom: "10px" }}>💡 Tips</div>
                  {["10–20% discount works best for first orders", "Set a minimum order to protect earnings", "A catchy promo code feels special to buyers"].map((tip, i) => (
                    <div key={i} style={{ fontSize: "12px", color: "#78350f", marginBottom: "6px", display: "flex", gap: "6px" }}><span>▸</span><span>{tip}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
        {tab === "orders" && (
          <div className="fade-in">
            <h2 style={{ margin: "0 0 4px", fontSize: "24px", color: "#1a1a1a" }}>📦 All Orders</h2>
            <p style={{ color: "#999", fontSize: "14px", margin: "0 0 20px" }}>{stats.total} orders · {stats.firstOrders} first-time buyers</p>
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#aaa" }}>Loading orders…</div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "20px", color: "#aaa", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>📦</div>
                <div style={{ fontWeight: 700 }}>No orders yet</div>
              </div>
            ) : (
              <div style={{ background: "white", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 120px 80px", padding: "12px 24px", background: "#fafafa", borderBottom: "1px solid #f0f0f0", fontSize: "11px", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <span>Customer</span><span>Date</span><span>Items</span><span>Status</span><span>Total</span>
                </div>
                {orders.map((o, i) => (
                  <div key={i} className="order-row" style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 120px 80px", padding: "14px 24px", borderBottom: i < orders.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px" }}>{o.buyer_name || `Order #${o.id}`}</div>
                      {o.is_first_order && <span style={{ fontSize: "10px", background: "#fff7ed", color: "#f97316", padding: "2px 7px", borderRadius: "8px", fontWeight: 700 }}>🎁 1st</span>}
                    </div>
                    <div style={{ fontSize: "13px", color: "#888" }}>{o.created_at}</div>
                    <div style={{ fontSize: "13px", color: "#555" }}>{o.items}</div>
                    <div><span style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "20px", fontWeight: 700, background: statusBg[o.status] || "#f5f5f5", color: statusColor[o.status] || "#555" }}>{o.status}</span></div>
                    <div style={{ fontWeight: 800, color: accent }}>₹{o.total_amount}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === "settings" && (
          <div className="fade-in">
            <h2 style={{ margin: "0 0 4px", fontSize: "24px", color: "#1a1a1a" }}>⚙️ Kitchen Settings</h2>
            <p style={{ color: "#999", fontSize: "14px", margin: "0 0 24px" }}>Manage your home kitchen profile</p>
            <div style={{ maxWidth: "500px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {[["Full Name", "name", "text", "Your name"], ["Kitchen Name", "kitchenName", "text", "e.g. Priya's Kitchen"], ["Phone Number", "phone", "tel", "+91 XXXXXXXXXX"], ["Home Address", "address", "text", "Your full address"]].map(([label, field, type, ph]) => (
                <div key={field} className="dash-card" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#888", display: "block", marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
                  <input type={type} value={sellerInfo[field] || ""} placeholder={ph} onChange={e => setSellerInfo(p => ({ ...p, [field]: e.target.value }))} style={inp()} />
                </div>
              ))}
              <div className="dash-card" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#888", display: "block", marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.5px" }}>About Your Kitchen</label>
                <textarea value={sellerInfo.bio || ""} placeholder="Tell buyers what makes your food special..." onChange={e => setSellerInfo(p => ({ ...p, bio: e.target.value }))} style={{ ...inp(), minHeight: "80px" }} />
              </div>
              <button onClick={saveSettings} style={{ padding: "14px", borderRadius: "14px", border: "none", background: settingsSaved ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #f97316, #ea580c)", color: "white", fontWeight: 800, fontSize: "15px", cursor: "pointer", fontFamily: "Sora, sans-serif", transition: "all 0.3s" }}>
                {settingsSaved ? "✓ Saved!" : "💾 Save Settings"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}