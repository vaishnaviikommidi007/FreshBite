import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Recommendation() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [veg, setVeg] = useState(null);
  const [prefs, setPrefs] = useState({
    spicy: 0.5,
    sweet: 0.5,
    healthy: 0.5,
    heavy: 0.5
  });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSlider = (e) => {
    setPrefs({ ...prefs, [e.target.name]: parseFloat(e.target.value) });
  };

  const getRecommendations = async () => {
    if (veg === null) {
      alert("Please select Veg or Non-Veg first!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5001/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...prefs, veg: veg ? 1 : 0 })
      });
      const data = await res.json();
      setRecommendations(data.recommendations);
      setStep(2);
    } catch (err) {
      alert("ML server not reachable ❌ Run: python ml_server.py");
    } finally {
      setLoading(false);
    }
  };

  const sliderConfig = [
    { name: "spicy",   emoji: "🌶️", label: "Spicy",          left: "Mild",    right: "Very Spicy" },
    { name: "sweet",   emoji: "🍬", label: "Sweet",          left: "Not Sweet", right: "Very Sweet" },
    { name: "healthy", emoji: "🥗", label: "Healthy",        left: "Indulgent", right: "Very Healthy" },
    { name: "heavy",   emoji: "🍖", label: "Filling / Heavy", left: "Light",   right: "Very Heavy" }
  ];

  const s = {
    page: {
      minHeight: "100vh",
      backgroundColor: "#fff5f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "30px 20px",
      fontFamily: "sans-serif"
    },
    card: {
      backgroundColor: "white",
      borderRadius: "16px",
      padding: "35px",
      width: "100%",
      maxWidth: "500px",
      boxShadow: "0 6px 25px rgba(0,0,0,0.1)"
    },
    title: {
      color: "#ff6b6b",
      textAlign: "center",
      fontSize: "24px",
      marginBottom: "6px"
    },
    subtitle: {
      textAlign: "center",
      color: "#999",
      fontSize: "14px",
      marginBottom: "25px"
    },
    vegRow: {
      display: "flex",
      gap: "12px",
      marginBottom: "25px"
    },
    vegBtn: (selected, isVeg) => ({
      flex: 1,
      padding: "10px",
      borderRadius: "10px",
      border: `2px solid ${selected ? (isVeg ? "#4caf50" : "#ff6b6b") : "#eee"}`,
      backgroundColor: selected ? (isVeg ? "#f0fff0" : "#fff5f5") : "white",
      cursor: "pointer",
      fontWeight: "bold",
      fontSize: "15px",
      color: selected ? (isVeg ? "#4caf50" : "#ff6b6b") : "#aaa"
    }),
    sliderBox: { marginBottom: "20px" },
    sliderTop: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "14px",
      fontWeight: "600",
      color: "#444",
      marginBottom: "6px"
    },
    sliderHints: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "11px",
      color: "#bbb",
      marginTop: "3px"
    },
    slider: { width: "100%", accentColor: "#ff6b6b" },
    button: {
      width: "100%",
      padding: "13px",
      backgroundColor: "#ff6b6b",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontSize: "16px",
      cursor: "pointer",
      fontWeight: "bold",
      marginTop: "10px"
    },
    dishCard: {
      backgroundColor: "#fff5f5",
      borderRadius: "12px",
      padding: "14px 18px",
      marginTop: "12px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      border: "1px solid #ffd6d6"
    },
    matchBar: (pct) => ({
      height: "5px",
      backgroundColor: "#ff6b6b",
      borderRadius: "5px",
      width: `${pct}%`,
      marginTop: "6px"
    }),
    badge: (veg) => ({
      backgroundColor: veg ? "#4caf50" : "#ff6b6b",
      color: "white",
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "bold"
    }),
    secondButton: {
      width: "100%",
      padding: "13px",
      backgroundColor: "#333",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontSize: "15px",
      cursor: "pointer",
      marginTop: "12px",
      fontWeight: "bold"
    }
  };

  // ── STEP 1: Preferences ──────────────────────────────
  if (step === 1) return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={s.title}>🍽️ What are you craving?</h2>
        <p style={s.subtitle}>Tell us your taste and we'll find the perfect dish</p>

        {/* Veg / Non-veg toggle */}
        <p style={{ fontWeight: "bold", color: "#555", marginBottom: "10px" }}>
          Food preference:
        </p>
        <div style={s.vegRow}>
          <button style={s.vegBtn(veg === true, true)}  onClick={() => setVeg(true)}>
            🟢 Vegetarian
          </button>
          <button style={s.vegBtn(veg === false, false)} onClick={() => setVeg(false)}>
            🔴 Non-Vegetarian
          </button>
        </div>

        {/* Sliders */}
        {sliderConfig.map(({ name, emoji, label, left, right }) => (
          <div key={name} style={s.sliderBox}>
            <div style={s.sliderTop}>
              <span>{emoji} {label}</span>
              <span style={{ color: "#ff6b6b" }}>
                {Math.round(prefs[name] * 10)} / 10
              </span>
            </div>
            <input
              type="range"
              name={name}
              min="0" max="1" step="0.1"
              value={prefs[name]}
              onChange={handleSlider}
              style={s.slider}
            />
            <div style={s.sliderHints}>
              <span>{left}</span>
              <span>{right}</span>
            </div>
          </div>
        ))}

        <button style={s.button} onClick={getRecommendations}>
          {loading ? "Finding dishes... 🔍" : "✨ Show My Recommendations"}
        </button>
      </div>
    </div>
  );

  // ── STEP 2: Results ──────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={s.title}>✨ Your Top Picks!</h2>
        <p style={s.subtitle}>Matched using your taste preferences</p>

        {recommendations.map((dish, i) => (
          <div key={i} style={s.dishCard}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "bold", color: "#333", fontSize: "16px" }}>
                {dish.name}
              </div>
              <div style={{ color: "#aaa", fontSize: "12px", marginTop: "2px" }}>
                {dish.category}
              </div>
              <div style={s.matchBar(dish.match)}>
              </div>
              <div style={{ fontSize: "11px", color: "#ff6b6b", marginTop: "3px" }}>
                {dish.match}% match
              </div>
            </div>
            <div style={{ marginLeft: "15px", textAlign: "center" }}>
              <span style={s.badge(dish.veg)}>
                {dish.veg ? "🟢 Veg" : "🔴 Non-Veg"}
              </span>
              <div style={{ fontSize: "11px", color: "#bbb", marginTop: "5px" }}>
                #{i + 1} Pick
              </div>
            </div>
          </div>
        ))}

        <button style={s.button} onClick={() => navigate("/menu")}>
          🍴 Browse Full Menu
        </button>

        <button style={s.secondButton} onClick={() => setStep(1)}>
          🔄 Change My Preferences
        </button>
      </div>
    </div>
  );
}

export default Recommendation;