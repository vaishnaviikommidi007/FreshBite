// src/pages/NearestSellers.jsx — FreshBite
import { useState, useEffect } from "react";

const API = "http://localhost:5000/api";

// ── Utility ────────────────────────────────────────────────────
const getUser = () => JSON.parse(localStorage.getItem("user") || "null");

export default function NearestSellers({ cartItems = [] }) {
  const [mode, setMode]         = useState("gps"); // "gps" | "manual"
  const [gpsStatus, setGpsStatus] = useState("idle"); // idle | loading | success | error
  const [coords, setCoords]     = useState(null);   // { lat, lng }
  const [manualArea, setManualArea] = useState("");
  const [radius, setRadius]     = useState(10);
  const [sellers, setSellers]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [locationSaved, setLocationSaved] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const chooseSeller = (seller) => {
    setSelectedSeller(seller);
    if (seller?.id != null) {
      localStorage.setItem("selectedSellerId", String(seller.id));
      localStorage.setItem("selectedSellerName", seller.name || "");
    }
  };

  // ── Auto-detect GPS on mount ───────────────────────────────
  useEffect(() => {
    if (navigator.geolocation) {
      setGpsStatus("loading");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsStatus("success");
        },
        () => {
          setGpsStatus("error");
          setMode("manual"); // auto-fallback to manual
        },
        { timeout: 8000 }
      );
    } else {
      setGpsStatus("error");
      setMode("manual");
    }
  }, []);

  // ── Save user location to backend ─────────────────────────
  const saveLocation = async () => {
    const user = getUser();
    if (!user) return;
    try {
      await fetch(`${API}/location/save-user-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:   user.id,
          latitude:  coords?.lat  || null,
          longitude: coords?.lng  || null,
          area:      manualArea   || null,
        }),
      });
      setLocationSaved(true);
    } catch (_) {}
  };

  // ── Find nearest sellers ───────────────────────────────────
  const findSellers = async () => {
    setError("");
    setSellers([]);
    setSelectedSeller(null);
    localStorage.removeItem("selectedSellerId");
    localStorage.removeItem("selectedSellerName");

    if (mode === "gps" && !coords)
      return setError("GPS location not available. Switch to manual.");
    if (mode === "manual" && !manualArea.trim())
      return setError("Please enter your area or city name.");

    setLoading(true);
    await saveLocation();

    try {
      const body = {
        radius_km: radius,
        ...(coords && { latitude: coords.lat, longitude: coords.lng }),
        ...(manualArea.trim() && { area: manualArea.trim() }),
        ...(cartItems.length > 0 && { dish_ids: cartItems.map(i => i.id) }),
      };

      const res  = await fetch(`${API}/location/nearest-sellers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Search failed");
      setSellers(data.sellers || []);
      if ((data.sellers || []).length === 0)
        setError("No home cooks found nearby. Try increasing the radius or enter a different area.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Star rating display ────────────────────────────────────
  const Stars = ({ rating }) => {
    const full  = Math.floor(rating || 0);
    const empty = 5 - full;
    return (
      <span className="stars">
        {"★".repeat(full)}{"☆".repeat(empty)}
      </span>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');

        :root {
          --cream:   #fdf6ec;
          --orange:  #e8622a;
          --orange2: #f4845f;
          --brown:   #3b1f0e;
          --brown2:  #7a4528;
          --green:   #2d7a4f;
          --card-bg: #fff9f3;
          --border:  #f0dcc8;
          --shadow:  0 4px 24px rgba(59,31,14,0.10);
        }

        .fb-wrap {
          min-height: 100vh;
          background: var(--cream);
          font-family: 'DM Sans', sans-serif;
          color: var(--brown);
          padding: 0 0 60px;
        }

        /* ── Header ── */
        .fb-header {
          background: var(--brown);
          color: var(--cream);
          padding: 28px 32px 22px;
          display: flex;
          align-items: flex-end;
          gap: 14px;
        }
        .fb-header-icon { font-size: 2.2rem; }
        .fb-header h1 {
          font-family: 'Fraunces', serif;
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          line-height: 1.1;
        }
        .fb-header p {
          margin: 4px 0 0;
          font-size: 0.85rem;
          opacity: 0.7;
        }

        /* ── Main card ── */
        .fb-card {
          background: var(--card-bg);
          border: 1.5px solid var(--border);
          border-radius: 20px;
          padding: 28px;
          margin: 28px 24px 0;
          box-shadow: var(--shadow);
        }
        .fb-card-title {
          font-family: 'Fraunces', serif;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 18px;
          color: var(--brown);
        }

        /* ── Mode toggle ── */
        .mode-toggle {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .mode-btn {
          flex: 1;
          padding: 10px 14px;
          border-radius: 12px;
          border: 2px solid var(--border);
          background: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--brown2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }
        .mode-btn.active {
          background: var(--orange);
          border-color: var(--orange);
          color: #fff;
        }

        /* ── GPS status ── */
        .gps-status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 16px;
          font-size: 0.88rem;
          font-weight: 500;
        }
        .gps-status.loading { background: #fff8e6; color: #a06000; border: 1.5px solid #f7d98b; }
        .gps-status.success { background: #edfaf3; color: var(--green); border: 1.5px solid #a8e6c3; }
        .gps-status.error   { background: #fff0ed; color: var(--orange); border: 1.5px solid #ffc9b8; }
        .gps-dot {
          width: 9px; height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .gps-status.loading .gps-dot { background: #f0a500; animation: pulse 1s infinite; }
        .gps-status.success .gps-dot { background: var(--green); }
        .gps-status.error   .gps-dot { background: var(--orange); }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        /* ── Input ── */
        .fb-input-wrap { margin-bottom: 16px; }
        .fb-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--brown2);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .fb-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.97rem;
          background: #fff;
          color: var(--brown);
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .fb-input:focus { border-color: var(--orange); }

        /* ── Radius slider ── */
        .radius-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .radius-row label { font-size: 0.82rem; font-weight: 600; color: var(--brown2); white-space: nowrap; text-transform: uppercase; letter-spacing: 0.05em; }
        .radius-row input[type=range] { flex: 1; accent-color: var(--orange); }
        .radius-badge {
          background: var(--orange);
          color: #fff;
          border-radius: 8px;
          padding: 3px 10px;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
        }

        /* ── Cart hint ── */
        .cart-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff8e6;
          border: 1.5px solid #f7d98b;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.84rem;
          color: #7a5500;
          margin-bottom: 18px;
        }

        /* ── Search button ── */
        .fb-btn {
          width: 100%;
          padding: 15px;
          background: var(--orange);
          color: #fff;
          border: none;
          border-radius: 14px;
          font-family: 'Fraunces', serif;
          font-size: 1.05rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .fb-btn:hover:not(:disabled) { background: #c94e1c; }
        .fb-btn:active { transform: scale(0.98); }
        .fb-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Error ── */
        .fb-error {
          background: #fff0ed;
          border: 1.5px solid #ffc9b8;
          color: #c0390e;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 0.88rem;
          margin: 16px 24px 0;
        }

        /* ── Results header ── */
        .results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 24px 10px;
        }
        .results-header h2 {
          font-family: 'Fraunces', serif;
          font-size: 1.15rem;
          margin: 0;
          color: var(--brown);
        }
        .results-count {
          background: var(--green);
          color: #fff;
          border-radius: 20px;
          padding: 3px 12px;
          font-size: 0.82rem;
          font-weight: 600;
        }

        /* ── Seller cards ── */
        .sellers-list { padding: 0 24px; display: flex; flex-direction: column; gap: 14px; }

        .seller-card {
          background: var(--card-bg);
          border: 1.5px solid var(--border);
          border-radius: 18px;
          padding: 18px;
          box-shadow: var(--shadow);
          cursor: pointer;
          transition: border-color 0.2s, transform 0.15s;
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .seller-card:hover { border-color: var(--orange2); transform: translateY(-2px); }
        .seller-card.selected { border-color: var(--orange); background: #fff5ef; }

        .seller-avatar {
          width: 58px; height: 58px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--orange2), var(--brown2));
          display: flex; align-items: center; justify-content: center;
          font-size: 1.6rem;
          flex-shrink: 0;
          overflow: hidden;
        }
        .seller-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .seller-info { flex: 1; min-width: 0; }
        .seller-name {
          font-family: 'Fraunces', serif;
          font-size: 1.05rem;
          font-weight: 600;
          margin: 0 0 4px;
          color: var(--brown);
        }
        .seller-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 6px;
        }
        .seller-tag {
          font-size: 0.78rem;
          padding: 3px 9px;
          border-radius: 20px;
          font-weight: 500;
        }
        .tag-area  { background: #f0dcc8; color: var(--brown2); }
        .tag-dist  { background: #edfaf3; color: var(--green); }
        .tag-type  { background: #fff0ed; color: var(--orange); }

        .stars { color: #e8622a; font-size: 0.9rem; letter-spacing: 1px; }

        .seller-select-btn {
          padding: 8px 16px;
          background: var(--orange);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          align-self: center;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .seller-select-btn:hover { background: #c94e1c; }
        .seller-select-btn.chosen { background: var(--green); }

        /* ── Selected banner ── */
        .selected-banner {
          margin: 16px 24px 0;
          background: var(--green);
          color: #fff;
          border-radius: 14px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.92rem;
          font-weight: 500;
        }
        .selected-banner strong { font-family: 'Fraunces', serif; font-size: 1rem; }

        /* ── Empty state ── */
        .empty-state {
          text-align: center;
          padding: 40px 24px;
          color: var(--brown2);
        }
        .empty-state .empty-icon { font-size: 3rem; margin-bottom: 12px; }
        .empty-state p { font-size: 0.92rem; margin: 0; opacity: 0.7; }
      `}</style>

      <div className="fb-wrap">
        {/* Header */}
        <div className="fb-header">
          <div className="fb-header-icon">🍱</div>
          <div>
            <h1>Find Home Cooks Near You</h1>
            <p>Fresh, home-cooked food delivered from your neighbourhood</p>
          </div>
        </div>

        {/* Location card */}
        <div className="fb-card">
          <p className="fb-card-title">📍 Your Delivery Location</p>

          {/* Mode toggle */}
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === "gps" ? "active" : ""}`}
              onClick={() => setMode("gps")}
            >
              🛰️ Use GPS
            </button>
            <button
              className={`mode-btn ${mode === "manual" ? "active" : ""}`}
              onClick={() => setMode("manual")}
            >
              ✏️ Enter Manually
            </button>
          </div>

          {/* GPS status */}
          {mode === "gps" && (
            <div className={`gps-status ${gpsStatus}`}>
              <div className="gps-dot" />
              {gpsStatus === "loading" && "Detecting your location…"}
              {gpsStatus === "success" && `Location detected — ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}
              {gpsStatus === "error"   && "GPS unavailable. Please enter your area manually."}
              {gpsStatus === "idle"    && "Waiting for GPS…"}
            </div>
          )}

          {/* Manual input */}
          {mode === "manual" && (
            <div className="fb-input-wrap">
              <label className="fb-label">Area / City</label>
              <input
                className="fb-input"
                type="text"
                placeholder="e.g. Andheri West, Mumbai"
                value={manualArea}
                onChange={e => setManualArea(e.target.value)}
              />
            </div>
          )}

          {/* Radius slider (GPS mode only) */}
          {mode === "gps" && coords && (
            <div className="radius-row">
              <label>Search Radius</label>
              <input
                type="range" min={1} max={30} step={1}
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
              />
              <span className="radius-badge">{radius} km</span>
            </div>
          )}

          {/* Cart hint */}
          {cartItems.length > 0 && (
            <div className="cart-hint">
              🛒 Filtering sellers who can make your {cartItems.length} cart item{cartItems.length > 1 ? "s" : ""}
            </div>
          )}

          {/* Search button */}
          <button className="fb-btn" onClick={findSellers} disabled={loading}>
            {loading ? "🔍 Searching…" : "🔍 Find Nearest Home Cooks"}
          </button>
        </div>

        {/* Error */}
        {error && <div className="fb-error">⚠️ {error}</div>}

        {/* Selected seller banner */}
        {selectedSeller && (
          <div className="selected-banner">
            ✅ <div>Ordering from <strong>{selectedSeller.name}</strong> — your cart will be placed with this cook</div>
          </div>
        )}

        {/* Results */}
        {sellers.length > 0 && (
          <>
            <div className="results-header">
              <h2>Home Cooks Found</h2>
              <span className="results-count">{sellers.length} nearby</span>
            </div>
            <div className="sellers-list">
              {sellers.map(seller => (
                <div
                  key={seller.id}
                  className={`seller-card ${selectedSeller?.id === seller.id ? "selected" : ""}`}
                  onClick={() => chooseSeller(seller)}
                >
                  <div className="seller-avatar">
                    {seller.profile_image
                      ? <img src={seller.profile_image} alt={seller.name} />
                      : "👩‍🍳"}
                  </div>
                  <div className="seller-info">
                    <div className="seller-name">{seller.name}</div>
                    <Stars rating={seller.rating} />
                    <div className="seller-meta">
                      {(seller.area || seller.city) && (
                        <span className="seller-tag tag-area">
                          📍 {[seller.area, seller.city].filter(Boolean).join(", ")}
                        </span>
                      )}
                      {seller.distance_km != null && (
                        <span className="seller-tag tag-dist">
                          🚴 {seller.distance_km} km away
                        </span>
                      )}
                      {seller.match_type === "area" && (
                        <span className="seller-tag tag-type">Area match</span>
                      )}
                    </div>
                  </div>
                  <button
                    className={`seller-select-btn ${selectedSeller?.id === seller.id ? "chosen" : ""}`}
                    onClick={e => { e.stopPropagation(); chooseSeller(seller); }}
                  >
                    {selectedSeller?.id === seller.id ? "✓ Chosen" : "Select"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state after search */}
        {!loading && sellers.length === 0 && !error && locationSaved && (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <p>Search for home cooks near you using the form above</p>
          </div>
        )}
      </div>
    </>
  );
}