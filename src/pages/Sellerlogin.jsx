import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

export default function SellerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inp = (extra = {}) => ({
    width: "100%", padding: "13px 16px", borderRadius: "12px",
    border: "1.5px solid #e8e8e8", fontSize: "14px",
    fontFamily: "Sora, sans-serif", outline: "none",
    background: "white", color: "#1a1a1a",
    boxSizing: "border-box", transition: "border 0.2s",
    ...extra
  });

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sellers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("sellerId", data.sellerId);
      localStorage.setItem("sellerName", data.kitchenName || data.name);
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
        .login-wrap { min-height: 100vh; display: flex; }
        .login-left {
          width: 380px; flex-shrink: 0;
          background: linear-gradient(160deg, #f97316 0%, #ea580c 50%, #c2410c 100%);
          padding: 60px 40px; display: flex; flex-direction: column;
          justify-content: space-between; position: relative; overflow: hidden;
        }
        .login-left::before {
          content: ''; position: absolute; top: -80px; right: -80px;
          width: 300px; height: 300px; border-radius: 50%;
          background: rgba(255,255,255,0.07);
        }
        .login-right {
          flex: 1; display: flex; align-items: center;
          justify-content: center; padding: 60px 40px;
        }
        .login-card {
          background: white; border-radius: 24px; padding: 44px 40px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.07);
          width: 100%; max-width: 440px;
          animation: fadeUp 0.35s ease;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
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
        .error-box {
          background: #fff5f5; border: 1px solid #fecaca; border-radius: 12px;
          padding: 12px 16px; color: #e8534a; font-size: 13px; font-weight: 600;
          margin-bottom: 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; display: inline-block; }
      `}</style>

      <div className="login-wrap">
        {/* Left Panel */}
        <div className="login-left">
          <div style={{ fontWeight: 800, fontSize: "24px", color: "white", position: "relative", zIndex: 1 }}>
            🍔 FreshBite
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "white", lineHeight: 1.2, marginBottom: "16px" }}>
              Welcome<br />Back, Chef!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: 1.7 }}>
              Log in to manage your kitchen, track orders, and keep your menu fresh.
            </p>
          </div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", position: "relative", zIndex: 1 }}>
            © 2026 FreshBite · Made with ❤️
          </div>
        </div>

        {/* Right Panel */}
        <div className="login-right">
          <div className="login-card">
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#1a1a1a", marginBottom: "6px" }}>
              🔑 Seller Login
            </div>
            <div style={{ fontSize: "14px", color: "#aaa", marginBottom: "28px" }}>
              Sign in to your seller account
            </div>

            {error && <div className="error-box">⚠️ {error}</div>}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#555", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "7px", display: "block" }}>
                Email Address
              </label>
              <input style={inp()} type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#555", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "7px", display: "block" }}>
                Password
              </label>
              <input style={inp()} type="password" placeholder="Your password"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>

            <button className="submit-btn" onClick={handleLogin} disabled={loading}>
              {loading ? <span className="spin">⏳</span> : "Login to Dashboard →"}
            </button>

            <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#aaa" }}>
              New here?{" "}
              <span
                onClick={() => navigate("/seller/register")}
                style={{ color: "#f97316", fontWeight: 700, cursor: "pointer" }}
              >
                Register your kitchen →
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}