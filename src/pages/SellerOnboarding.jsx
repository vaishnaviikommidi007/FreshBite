import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

const FOOD_CATEGORIES = ["Breakfast","Lunch","Dinner","Snacks","Sweets","Drinks","Biryani","South Indian","North Indian","Chinese","Healthy"];

function StepIndicator({ current }) {
  const steps = [
    { num: 1, label: "Your Details", icon: "👤" },
    { num: 2, label: "Location",     icon: "📍" },
    { num: 3, label: "Your Menu",    icon: "🍱" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "40px", gap: 0 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.num}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px",
              background: current >= s.num
                ? "linear-gradient(135deg, #f97316, #ea580c)"
                : "white",
              border: current >= s.num ? "none" : "2px solid #e8e8e8",
              boxShadow: current === s.num ? "0 6px 20px rgba(249,115,22,0.4)" : "none",
              transition: "all 0.3s",
              transform: current === s.num ? "scale(1.1)" : "scale(1)"
            }}>
              {current > s.num ? "✓" : s.icon}
            </div>
            <span style={{
              fontSize: "11px", fontWeight: 700,
              color: current >= s.num ? "#f97316" : "#ccc",
              fontFamily: "Sora, sans-serif", letterSpacing: "0.3px"
            }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: "80px", height: "2px", marginBottom: "22px",
              background: current > s.num
                ? "linear-gradient(90deg, #f97316, #ea580c)"
                : "#e8e8e8",
              transition: "background 0.4s"
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function SellerOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sellerId, setSellerId] = useState(null);

  // Step 1 — Details
  const [details, setDetails] = useState({
    name: "", kitchenName: "", email: "", password: "", phone: "", bio: ""
  });

  // Step 2 — Location
  const [locStatus, setLocStatus] = useState("idle");
  const [location, setLocation] = useState({ lat: null, lng: null, address: "" });

  // Step 3 — Menu
  const [menuItems, setMenuItems] = useState([
    { name: "", category: "Lunch", price: "", desc: "", veg: true, available: true }
  ]);

  const inp = (extra = {}) => ({
    width: "100%", padding: "13px 16px", borderRadius: "12px",
    border: "1.5px solid #e8e8e8", fontSize: "14px",
    fontFamily: "Sora, sans-serif", outline: "none",
    background: "white", color: "#1a1a1a",
    boxSizing: "border-box", transition: "border 0.2s",
    ...extra
  });

  const submitDetails = async () => {
    setError("");
    const { name, kitchenName, email, password, phone } = details;
    if (!name || !kitchenName || !email || !password || !phone) {
      setError("Please fill all required fields."); return;
    }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sellers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setSellerId(data.sellerId);
      localStorage.setItem("sellerId", data.sellerId);
      localStorage.setItem("sellerName", details.kitchenName);
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const detectLocation = () => {
    setLocStatus("loading");
    setError("");
    if (!navigator.geolocation) { setLocStatus("error"); setError("GPS not supported."); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const d = await r.json();
          const a = d.address;
          address = [a.road, a.suburb || a.neighbourhood, a.city || a.town, a.state].filter(Boolean).join(", ");
        } catch {}
        setLocation({ lat, lng, address });
        setLocStatus("success");
      },
      () => { setLocStatus("error"); setError("Location access denied. Please allow GPS and retry."); },
      { timeout: 10000 }
    );
  };

  const submitLocation = async () => {
    if (!location.lat) { setError("Please detect your location first."); return; }
    setLoading(true); setError("");
    try {
      const id = sellerId || localStorage.getItem("sellerId");
      const res = await fetch(`${API_BASE}/sellers/${id}/location`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: location.lat, lng: location.lng, address: location.address })
      });
      if (!res.ok) throw new Error("Failed to save location");
      setStep(3);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const addMenuItem = () => {
    setMenuItems(prev => [...prev, { name: "", category: "Lunch", price: "", desc: "", veg: true, available: true }]);
  };

  const updateMenuItem = (i, field, value) => {
    setMenuItems(prev => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      return updated;
    });
  };

  const removeMenuItem = (i) => {
    setMenuItems(prev => prev.filter((_, idx) => idx !== i));
  };

  const submitMenu = async () => {
    const valid = menuItems.filter(m => m.name && m.price);
    if (valid.length === 0) { setError("Please add at least one menu item with name and price."); return; }
    setLoading(true); setError("");
    try {
      const id = sellerId || localStorage.getItem("sellerId");
      const res = await fetch(`${API_BASE}/sellers/${id}/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: valid })
      });
      if (!res.ok) throw new Error("Failed to save menu");
      navigate("/seller/dashboard");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fef6f5; font-family: 'Sora', sans-serif; }

        .onboard-wrap { min-height: 100vh; display: flex; }

        .onboard-left {
          width: 380px; flex-shrink: 0;
          background: linear-gradient(160deg, #f97316 0%, #ea580c 50%, #c2410c 100%);
          padding: 60px 40px;
          display: flex; flex-direction: column; justify-content: space-between;
          position: relative; overflow: hidden;
        }
        .onboard-left::before {
          content: ''; position: absolute; top: -80px; right: -80px;
          width: 300px; height: 300px; border-radius: 50%;
          background: rgba(255,255,255,0.07);
        }
        .onboard-left::after {
          content: ''; position: absolute; bottom: -60px; left: -60px;
          width: 240px; height: 240px; border-radius: 50%;
          background: rgba(255,255,255,0.05);
        }
        .onboard-left-logo { font-size: 24px; font-weight: 800; color: white; font-family: 'Sora', sans-serif; position: relative; z-index: 1; }
        .onboard-left-content { position: relative; z-index: 1; }
        .onboard-left h2 { font-size: 32px; font-weight: 800; color: white; line-height: 1.2; margin-bottom: 16px; }
        .onboard-left p { color: rgba(255,255,255,0.8); font-size: 14px; line-height: 1.7; }
        .onboard-perks { margin-top: 32px; display: flex; flex-direction: column; gap: 14px; }
        .onboard-perk {
          display: flex; gap: 12px; align-items: flex-start;
          background: rgba(255,255,255,0.1); border-radius: 14px;
          padding: 14px 16px; backdrop-filter: blur(8px);
        }
        .onboard-perk-icon {
          font-size: 22px; flex-shrink: 0; width: 40px; height: 40px;
          background: rgba(255,255,255,0.15); border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .onboard-perk-title { font-weight: 700; color: white; font-size: 13px; margin-bottom: 3px; }
        .onboard-perk-desc { color: rgba(255,255,255,0.75); font-size: 11px; line-height: 1.5; }
        .onboard-left-foot { color: rgba(255,255,255,0.5); font-size: 12px; position: relative; z-index: 1; }

        .onboard-right { flex: 1; padding: 60px 64px; display: flex; flex-direction: column; overflow-y: auto; }

        .onboard-card {
          background: white; border-radius: 24px; padding: 36px 40px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.07);
          max-width: 560px; width: 100%; margin: 0 auto;
          animation: fadeUp 0.35s ease;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .onboard-title { font-size: 24px; font-weight: 800; color: #1a1a1a; margin-bottom: 6px; }
        .onboard-sub { font-size: 14px; color: #aaa; margin-bottom: 28px; }

        .field-label {
          font-size: 12px; font-weight: 700; color: #555;
          letter-spacing: 0.5px; text-transform: uppercase;
          margin-bottom: 7px; display: block;
        }
        .field-wrap { margin-bottom: 16px; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .gps-btn {
          width: 100%; padding: 16px; border: 2px dashed rgba(249,115,22,0.4);
          border-radius: 16px; background: #fff7ed; color: #f97316;
          font-weight: 700; font-size: 15px; cursor: pointer;
          font-family: 'Sora', sans-serif; transition: all 0.3s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .gps-btn:hover { background: #ffedd5; border-color: #f97316; }
        .gps-btn.success { background: #f0fdf4; border-color: #22c55e; color: #22c55e; border-style: solid; }
        .gps-btn.loading { opacity: 0.7; cursor: not-allowed; }

        .location-box {
          background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 14px; padding: 16px 18px; margin-top: 14px;
        }
        .location-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
        .location-row:last-child { margin-bottom: 0; }

        .menu-item-card {
          background: #fafafa; border: 1.5px solid #f0f0f0;
          border-radius: 18px; padding: 20px 22px; margin-bottom: 16px;
          transition: border 0.2s; position: relative;
        }
        .menu-item-card:hover { border-color: rgba(249,115,22,0.3); }

        .menu-remove-btn {
          position: absolute; top: 14px; right: 14px;
          width: 28px; height: 28px; border-radius: 8px;
          background: #fff5f5; border: none; color: #e8534a;
          cursor: pointer; font-size: 14px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .menu-remove-btn:hover { background: #fee2e2; }

        .veg-toggle { display: flex; gap: 8px; }
        .veg-btn {
          flex: 1; padding: 8px; border-radius: 10px; border: 1.5px solid #e8e8e8;
          background: white; cursor: pointer; font-size: 12px; font-weight: 700;
          font-family: 'Sora', sans-serif; transition: all 0.2s;
        }
        .veg-btn.active-veg { background: #f0fdf4; border-color: #22c55e; color: #22c55e; }
        .veg-btn.active-nonveg { background: #fff5f5; border-color: #e8534a; color: #e8534a; }

        .add-item-btn {
          width: 100%; padding: 14px; border-radius: 14px;
          border: 2px dashed rgba(249,115,22,0.35);
          background: white; color: #f97316; font-weight: 700;
          font-size: 14px; cursor: pointer; font-family: 'Sora', sans-serif;
          transition: all 0.2s;
        }
        .add-item-btn:hover { background: #fff7ed; border-color: #f97316; }

        .submit-btn {
          width: 100%; padding: 15px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white; font-weight: 800; font-size: 16px;
          cursor: pointer; font-family: 'Sora', sans-serif;
          box-shadow: 0 6px 20px rgba(249,115,22,0.35);
          transition: all 0.3s; margin-top: 8px;
        }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(249,115,22,0.45); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .login-btn {
          width: 100%; padding: 14px; border-radius: 14px;
          border: 2px solid #f97316;
          background: white; color: #f97316;
          font-weight: 800; font-size: 15px;
          cursor: pointer; font-family: 'Sora', sans-serif;
          transition: all 0.2s; margin-top: 12px;
        }
        .login-btn:hover { background: #fff7ed; }

        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 20px 0 4px; color: #ccc; font-size: 12px; font-weight: 600;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px; background: #e8e8e8;
        }

        .back-btn {
          background: none; border: none; color: #aaa;
          font-size: 13px; cursor: pointer; font-family: 'Sora', sans-serif;
          font-weight: 600; padding: 0; margin-bottom: 20px;
          display: flex; align-items: center; gap: 6px; transition: color 0.2s;
        }
        .back-btn:hover { color: #555; }

        .error-box {
          background: #fff5f5; border: 1px solid #fecaca; border-radius: 12px;
          padding: 12px 16px; color: #e8534a; font-size: 13px; font-weight: 600;
          margin-bottom: 16px;
        }

        select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23999' d='M6 8L0 0h12z'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center;
          padding-right: 36px !important;
        }
        textarea { resize: vertical; min-height: 70px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; display: inline-block; }
      `}</style>

      <div className="onboard-wrap">

        {/* ── LEFT PANEL ── */}
        <div className="onboard-left">
          <div className="onboard-left-logo">🍔 FreshBite</div>
          <div className="onboard-left-content">
            <h2>Start Selling<br />From Home</h2>
            <p>Join our community of home chefs and turn your cooking passion into a thriving business.</p>
            <div className="onboard-perks">
              {[
                { icon: "💰", title: "Earn Daily", desc: "Get paid directly for every order you fulfill" },
                { icon: "📍", title: "Hyperlocal Delivery", desc: "We calculate delivery from your home to buyer" },
                { icon: "🎁", title: "First Order Discounts", desc: "Set offers to attract your first customers" },
                { icon: "📊", title: "Seller Dashboard", desc: "Track orders, revenue and manage your menu" },
              ].map(p => (
                <div className="onboard-perk" key={p.title}>
                  <div className="onboard-perk-icon">{p.icon}</div>
                  <div>
                    <div className="onboard-perk-title">{p.title}</div>
                    <div className="onboard-perk-desc">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="onboard-left-foot">© 2026 FreshBite · Made with ❤️</div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="onboard-right">
          <div style={{ maxWidth: "560px", width: "100%", margin: "0 auto" }}>

            <StepIndicator current={step} />

            {error && <div className="error-box">⚠️ {error}</div>}

            {/* ════ STEP 1 — DETAILS ════ */}
            {step === 1 && (
              <div className="onboard-card">
                <div className="onboard-title">👤 Your Details</div>
                <div className="onboard-sub">Tell us about you and your home kitchen</div>

                <div className="two-col">
                  <div className="field-wrap">
                    <label className="field-label">Full Name *</label>
                    <input style={inp()} placeholder="e.g. Priya Sharma"
                      value={details.name}
                      onChange={e => setDetails(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Kitchen Name *</label>
                    <input style={inp()} placeholder="e.g. Priya's Kitchen"
                      value={details.kitchenName}
                      onChange={e => setDetails(p => ({ ...p, kitchenName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="field-wrap">
                  <label className="field-label">Email Address *</label>
                  <input style={inp()} type="email" placeholder="you@example.com"
                    value={details.email}
                    onChange={e => setDetails(p => ({ ...p, email: e.target.value }))}
                  />
                </div>

                <div className="two-col">
                  <div className="field-wrap">
                    <label className="field-label">Password *</label>
                    <input style={inp()} type="password" placeholder="Min. 6 characters"
                      value={details.password}
                      onChange={e => setDetails(p => ({ ...p, password: e.target.value }))}
                    />
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Phone Number *</label>
                    <input style={inp()} type="tel" placeholder="+91 XXXXXXXXXX"
                      value={details.phone}
                      onChange={e => setDetails(p => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="field-wrap">
                  <label className="field-label">About Your Kitchen</label>
                  <textarea style={inp()} placeholder="Tell buyers what makes your food special..."
                    value={details.bio}
                    onChange={e => setDetails(p => ({ ...p, bio: e.target.value }))}
                  />
                </div>

                <button className="submit-btn" onClick={submitDetails} disabled={loading}>
                  {loading ? <span className="spin">⏳</span> : "Continue → Set Location"}
                </button>

                {/* ── LOGIN DIVIDER & BUTTON ── */}
                <div className="divider">Already have an account?</div>
                <button className="login-btn" onClick={() => navigate("/seller/login")}>
                  🔑 Login to Your Kitchen
                </button>
              </div>
            )}

            {/* ════ STEP 2 — LOCATION ════ */}
            {step === 2 && (
              <div className="onboard-card">
                <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
                <div className="onboard-title">📍 Your Location</div>
                <div className="onboard-sub">We use this to calculate delivery distance & fees for buyers</div>

                <div style={{
                  background: "#fff7ed", border: "1px solid rgba(249,115,22,0.2)",
                  borderRadius: "14px", padding: "16px 18px", marginBottom: "24px",
                  fontSize: "13px", color: "#92400e", lineHeight: 1.6
                }}>
                  📌 <strong>Important:</strong> Your exact home coordinates are used to calculate how far buyers are. This helps set fair delivery fees automatically.
                </div>

                <button
                  className={`gps-btn ${locStatus === "success" ? "success" : ""} ${locStatus === "loading" ? "loading" : ""}`}
                  onClick={detectLocation}
                  disabled={locStatus === "loading"}
                >
                  {locStatus === "loading" && <span className="spin">🌐</span>}
                  {locStatus === "idle"    && <><span>📡</span> Detect My Home Location</>}
                  {locStatus === "success" && <><span>✅</span> Location Detected — Re-detect</>}
                  {locStatus === "error"   && <><span>❌</span> Try Again</>}
                </button>

                {locStatus === "success" && location.lat && (
                  <div className="location-box">
                    <div className="location-row">
                      <span style={{ color: "#666" }}>📍 Address</span>
                      <span style={{ fontWeight: 700, color: "#1a1a1a", fontSize: "12px", textAlign: "right", maxWidth: "220px" }}>
                        {location.address}
                      </span>
                    </div>
                    <div className="location-row">
                      <span style={{ color: "#666" }}>🌐 Coordinates</span>
                      <span style={{ fontWeight: 700, color: "#1a1a1a", fontSize: "12px" }}>
                        {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                      </span>
                    </div>
                  </div>
                )}

                {locStatus === "error" && (
                  <div style={{
                    background: "#fff5f5", border: "1px solid #fecaca",
                    borderRadius: "14px", padding: "14px 18px", marginTop: "14px",
                    fontSize: "13px", color: "#e8534a"
                  }}>
                    Please allow location access in your browser and click Try Again.
                  </div>
                )}

                <div style={{ marginTop: "24px" }}>
                  <label className="field-label">Or enter address manually</label>
                  <input style={inp()} placeholder="Your full home address"
                    value={location.address}
                    onChange={e => setLocation(p => ({ ...p, address: e.target.value }))}
                  />
                </div>

                <button className="submit-btn" onClick={submitLocation} disabled={loading || !location.lat}>
                  {loading ? <span className="spin">⏳</span> : "Continue → Add Menu"}
                </button>
              </div>
            )}

            {/* ════ STEP 3 — MENU ════ */}
            {step === 3 && (
              <div className="onboard-card">
                <button className="back-btn" onClick={() => setStep(2)}>← Back</button>
                <div className="onboard-title">🍱 Your Menu</div>
                <div className="onboard-sub">Add dishes you want to sell — you can add more later from your dashboard</div>

                {menuItems.map((item, i) => (
                  <div className="menu-item-card" key={i}>
                    <div style={{
                      fontSize: "12px", fontWeight: 700, color: "#f97316",
                      marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.5px"
                    }}>
                      Dish #{i + 1}
                    </div>

                    {menuItems.length > 1 && (
                      <button className="menu-remove-btn" onClick={() => removeMenuItem(i)}>✕</button>
                    )}

                    <div className="two-col" style={{ marginBottom: "12px" }}>
                      <div>
                        <label className="field-label">Dish Name *</label>
                        <input style={inp()} placeholder="e.g. Chicken Biryani"
                          value={item.name}
                          onChange={e => updateMenuItem(i, "name", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="field-label">Price (₹) *</label>
                        <input style={inp()} type="number" placeholder="e.g. 150"
                          value={item.price}
                          onChange={e => updateMenuItem(i, "price", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="two-col" style={{ marginBottom: "12px" }}>
                      <div>
                        <label className="field-label">Category</label>
                        <select style={inp()} value={item.category}
                          onChange={e => updateMenuItem(i, "category", e.target.value)}>
                          {FOOD_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Type</label>
                        <div className="veg-toggle">
                          <button
                            className={`veg-btn ${item.veg ? "active-veg" : ""}`}
                            onClick={() => updateMenuItem(i, "veg", true)}
                          >🟢 Veg</button>
                          <button
                            className={`veg-btn ${!item.veg ? "active-nonveg" : ""}`}
                            onClick={() => updateMenuItem(i, "veg", false)}
                          >🔴 Non-Veg</button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="field-label">Description</label>
                      <textarea style={inp()} placeholder="Describe your dish..."
                        value={item.desc}
                        onChange={e => updateMenuItem(i, "desc", e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <button className="add-item-btn" onClick={addMenuItem}>
                  + Add Another Dish
                </button>

                <button className="submit-btn" onClick={submitMenu} disabled={loading}
                  style={{ marginTop: "20px" }}>
                  {loading
                    ? <span className="spin">⏳</span>
                    : `🚀 Launch My Kitchen (${menuItems.filter(m => m.name && m.price).length} dishes)`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
