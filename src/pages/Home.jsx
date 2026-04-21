import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// ✅ Helper to get user-specific cart key
const getCartKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const id = user?.id || user?.user_id || user?._id;
    return id ? `cart_${id}` : "cart_guest";
  } catch {
    return "cart_guest";
  }
};

function Home() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const isValidToken = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    return !!token && token !== "undefined" && token !== "null" && token.trim() !== "";
  };

  const [loggedIn, setLoggedIn] = useState(isValidToken);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const handleMenuClick = (e) => {
    e.preventDefault();
    if (!loggedIn) {
      navigate("/login");
    } else {
      navigate("/recommend");
    }
  };

  const handleSellClick = () => {
    const sellerId = localStorage.getItem("sellerId");
    if (sellerId) {
      navigate("/seller/dashboard");
    } else {
      navigate("/seller/login");
    }
  };

  // ✅ FIXED: Logout clears user-specific cart
  const handleLogout = () => {
    // Get cart key BEFORE clearing user from storage
    const cartKey = getCartKey();

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sellerId");
    localStorage.removeItem(cartKey);   // ✅ clears THIS user's cart
    localStorage.removeItem("cart");    // ✅ clears old generic cart key too (cleanup)
    sessionStorage.removeItem("token");
    setLoggedIn(false);
    setUser(null);
  };

  useEffect(() => {
    setLoggedIn(isValidToken());
    try {
      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    } catch {
      setUser(null);
    }

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const map = new window.google.maps.Map(document.getElementById("map"), {
          center: { lat, lng },
          zoom: 15,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#fdf0f0" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#e8534a" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#f5c5c2" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#ddeeff" }] },
            { featureType: "poi", elementType: "geometry", stylers: [{ color: "#fce8e6" }] },
          ],
        });

        new window.google.maps.Marker({
          position: { lat, lng },
          map,
          title: "Your Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#e8534a",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 3,
          },
        });

        setMapLoaded(true);
      });
    }
  }, []);

  const dishes = [
    { name: "Chicken Biryani", price: "₹199", rating: 4.8, time: "25 min", tag: "Bestseller", emoji: "🍛" },
    { name: "Margherita Pizza", price: "₹249", rating: 4.6, time: "30 min", tag: "Popular", emoji: "🍕" },
    { name: "Smash Burger", price: "₹149", rating: 4.7, time: "20 min", tag: "New", emoji: "🍔" },
    { name: "Paneer Tikka", price: "₹179", rating: 4.5, time: "22 min", tag: "Veg", emoji: "🥘" },
  ];

  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #fef6f5 !important; }

        .fb-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 999;
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 60px; height: 70px;
          transition: all 0.4s ease;
        }
        .fb-nav.scrolled {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(232,83,74,0.12);
          box-shadow: 0 4px 24px rgba(232,83,74,0.07);
        }

        .fb-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .fb-logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #e8534a, #c0392b);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(232,83,74,0.3);
        }
        .fb-logo-text { font-size: 22px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.5px; font-family: 'Sora', sans-serif; }
        .fb-logo-text span { color: #e8534a; }

        .fb-nav-links { display: flex; align-items: center; gap: 6px; }

        .fb-link {
          text-decoration: none; color: #555;
          font-size: 15px; font-weight: 500; font-family: 'Sora', sans-serif;
          padding: 8px 16px; border-radius: 8px;
          transition: all 0.25s;
        }
        .fb-link:hover { color: #e8534a; background: rgba(232,83,74,0.07); }

        .fb-btn-menu {
          background: linear-gradient(135deg, #e8534a, #c0392b);
          color: #fff; border: none; cursor: pointer;
          font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 600;
          padding: 9px 22px; border-radius: 25px;
          box-shadow: 0 4px 15px rgba(232,83,74,0.3);
          transition: all 0.3s;
        }
        .fb-btn-menu:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(232,83,74,0.45); }

        .fb-btn-sell {
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: #fff; border: none; cursor: pointer;
          font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 600;
          padding: 9px 22px; border-radius: 25px;
          box-shadow: 0 4px 15px rgba(249,115,22,0.3);
          transition: all 0.3s;
        }
        .fb-btn-sell:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(249,115,22,0.45); }

        .fb-btn-signup {
          text-decoration: none; color: #e8534a; font-family: 'Sora', sans-serif;
          font-size: 15px; font-weight: 600;
          padding: 8px 18px;
          border: 1.5px solid rgba(232,83,74,0.4); border-radius: 25px;
          transition: all 0.25s;
        }
        .fb-btn-signup:hover { background: rgba(232,83,74,0.08); border-color: #e8534a; }

        .fb-nav-avatar {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #e8534a, #c0392b);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700; color: #fff;
          text-decoration: none; cursor: pointer;
          box-shadow: 0 4px 12px rgba(232,83,74,0.3);
          transition: all 0.25s;
          border: 2px solid rgba(255,255,255,0.3);
        }
        .fb-nav-avatar:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(232,83,74,0.5);
        }

        .fb-btn-logout {
          background: none;
          border: 1.5px solid rgba(232,83,74,0.4);
          color: #e8534a; cursor: pointer;
          font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600;
          padding: 6px 14px; border-radius: 25px;
          transition: all 0.25s;
        }
        .fb-btn-logout:hover {
          background: rgba(232,83,74,0.08);
          border-color: #e8534a;
        }

        .fb-hero {
          min-height: 100vh;
          background: radial-gradient(ellipse at 70% 40%, rgba(232,83,74,0.1) 0%, transparent 55%),
                      radial-gradient(ellipse at 15% 80%, rgba(232,83,74,0.06) 0%, transparent 45%),
                      #fef6f5;
          display: flex; align-items: center;
          padding: 100px 60px 60px;
          position: relative; overflow: hidden;
          font-family: 'Sora', sans-serif;
        }

        .fb-hero-blob1 {
          position: absolute; top: 12%; right: 6%;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(232,83,74,0.1) 0%, transparent 70%);
          border-radius: 50%; pointer-events: none;
        }
        .fb-hero-blob2 {
          position: absolute; bottom: 8%; left: 4%;
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(232,83,74,0.06) 0%, transparent 70%);
          border-radius: 50%; pointer-events: none;
        }

        .fb-hero-left { flex: 1; max-width: 580px; z-index: 1; }

        .fb-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(232,83,74,0.1); border: 1px solid rgba(232,83,74,0.25);
          color: #e8534a; padding: 6px 18px; border-radius: 20px;
          font-size: 13px; font-weight: 600; letter-spacing: 1px;
          text-transform: uppercase; margin-bottom: 20px;
          font-family: 'Sora', sans-serif;
        }
        .fb-glow-dot {
          width: 10px; height: 10px; background: #e8534a;
          border-radius: 50%; display: inline-block; position: relative;
          flex-shrink: 0;
        }
        .fb-glow-dot::after {
          content: ''; position: absolute; inset: 0; border-radius: 50%;
          background: #e8534a; animation: fbPulse 1.5s ease-out infinite;
        }

        .fb-hero-h1 {
          font-size: clamp(40px, 5vw, 66px); font-weight: 800;
          line-height: 1.1; letter-spacing: -2px;
          color: #1a1a1a; margin-bottom: 24px; font-family: 'Sora', sans-serif;
        }
        .fb-hero-h1 span {
          background: linear-gradient(135deg, #e8534a, #ff8a6a);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .fb-hero-sub {
          font-size: 17px; color: #888;
          line-height: 1.7; margin-bottom: 40px; font-weight: 300; max-width: 420px;
          font-family: 'Sora', sans-serif;
        }
        .fb-hero-btns { display: flex; gap: 16px; flex-wrap: wrap; }

        .fb-cta-primary {
          background: linear-gradient(135deg, #e8534a, #c0392b);
          color: #fff; border: none; cursor: pointer;
          font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700;
          padding: 16px 36px; border-radius: 50px;
          box-shadow: 0 8px 30px rgba(232,83,74,0.35);
          transition: all 0.3s; letter-spacing: 0.5px;
        }
        .fb-cta-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(232,83,74,0.5); }

        .fb-cta-secondary {
          background: #fff; color: #333;
          padding: 15px 36px; border-radius: 50px;
          font-size: 16px; font-weight: 600;
          border: 2px solid rgba(0,0,0,0.1);
          cursor: pointer; text-decoration: none; display: inline-block;
          transition: all 0.3s; font-family: 'Sora', sans-serif;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }
        .fb-cta-secondary:hover { border-color: rgba(232,83,74,0.3); box-shadow: 0 8px 28px rgba(0,0,0,0.1); transform: translateY(-3px); }

        .fb-stats { display: flex; gap: 40px; margin-top: 52px; }
        .fb-stat-val { font-size: 26px; font-weight: 800; color: #e8534a; font-family: 'Sora', sans-serif; }
        .fb-stat-lbl { font-size: 13px; color: #aaa; margin-top: 2px; font-family: 'Sora', sans-serif; }

        .fb-hero-right { flex: 1; display: flex; justify-content: center; align-items: center; z-index: 1; }
        .fb-hero-circle {
          width: 340px; height: 340px;
          background: #fff;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 140px;
          box-shadow: 0 20px 70px rgba(232,83,74,0.18), 0 4px 20px rgba(0,0,0,0.06);
          border: 1px solid rgba(232,83,74,0.12);
          animation: fbFloat 4s ease-in-out infinite;
        }

        .sell-card {
          margin-top: 28px;
          background: linear-gradient(135deg, #fff7ed, #fff);
          border: 1.5px solid rgba(249,115,22,0.25);
          border-radius: 20px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          max-width: 420px;
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(249,115,22,0.08);
        }
        .sell-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(249,115,22,0.18);
          border-color: rgba(249,115,22,0.5);
        }
        .sell-card-icon {
          width: 52px; height: 52px; flex-shrink: 0;
          background: linear-gradient(135deg, #f97316, #ea580c);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 14px rgba(249,115,22,0.3);
        }
        .sell-card-title {
          font-weight: 800; font-size: 15px; color: #1a1a1a;
          font-family: 'Sora', sans-serif; margin-bottom: 3px;
        }
        .sell-card-sub {
          font-size: 12px; color: #999;
          font-family: 'Sora', sans-serif; line-height: 1.5;
        }
        .sell-card-arrow {
          font-size: 20px; color: #f97316;
          font-weight: 800; flex-shrink: 0;
        }

        .sell-section {
          padding: 90px 60px;
          background: linear-gradient(135deg, #fff7ed 0%, #fef6f5 100%);
          font-family: 'Sora', sans-serif;
        }
        .sell-section-inner {
          max-width: 1000px; margin: 0 auto;
          display: flex; gap: 60px; align-items: center; flex-wrap: wrap;
        }
        .sell-section-left { flex: 1; min-width: 280px; }
        .sell-section-right {
          flex: 1; min-width: 280px;
          display: flex; flex-direction: column; gap: 16px;
        }
        .sell-step-card {
          background: white; border-radius: 16px; padding: 20px 22px;
          display: flex; gap: 16px; align-items: flex-start;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          border: 1px solid rgba(249,115,22,0.1);
          transition: all 0.3s;
        }
        .sell-step-card:hover {
          transform: translateX(6px);
          border-color: rgba(249,115,22,0.3);
          box-shadow: 0 8px 28px rgba(249,115,22,0.1);
        }
        .sell-step-num {
          width: 36px; height: 36px; flex-shrink: 0;
          background: linear-gradient(135deg, #f97316, #ea580c);
          border-radius: 10px; color: white;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 15px;
        }
        .sell-step-title { font-weight: 700; font-size: 15px; color: #1a1a1a; margin-bottom: 4px; }
        .sell-step-desc { font-size: 13px; color: #999; line-height: 1.5; }

        .sell-cta-btn {
          margin-top: 28px;
          display: inline-block;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white; border: none; cursor: pointer;
          font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700;
          padding: 16px 36px; border-radius: 50px;
          box-shadow: 0 8px 30px rgba(249,115,22,0.35);
          transition: all 0.3s;
        }
        .sell-cta-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(249,115,22,0.5); }

        .fb-section { padding: 90px 60px; font-family: 'Sora', sans-serif; background: #fef6f5; }
        .fb-section-head { text-align: center; margin-bottom: 52px; }
        .fb-section-h2 { font-size: 38px; font-weight: 800; letter-spacing: -1px; color: #1a1a1a; margin-top: 8px; font-family: 'Sora', sans-serif; }
        .fb-section-h2 span { color: #e8534a; }

        .fb-features { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; max-width: 1000px; margin: 0 auto; }
        .fb-feat-card {
          background: #fff;
          border: 1px solid rgba(232,83,74,0.1);
          border-radius: 20px; padding: 36px 28px; text-align: center;
          transition: all 0.3s; flex: 1; min-width: 190px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .fb-feat-card:hover { border-color: rgba(232,83,74,0.35); transform: translateY(-5px); box-shadow: 0 16px 40px rgba(232,83,74,0.12); }
        .fb-feat-icon { font-size: 36px; margin-bottom: 18px; }
        .fb-feat-title { font-size: 17px; font-weight: 700; color: #1a1a1a; margin-bottom: 10px; font-family: 'Sora', sans-serif; }
        .fb-feat-desc { font-size: 14px; color: #999; line-height: 1.6; font-family: 'Sora', sans-serif; }

        .fb-dishes { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; max-width: 1100px; margin: 0 auto; }
        .fb-dish-card {
          background: #fff;
          border-radius: 20px; overflow: hidden;
          border: 1px solid rgba(232,83,74,0.1);
          transition: all 0.35s; cursor: pointer; position: relative; width: 240px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .fb-dish-card:hover { transform: translateY(-8px); border-color: rgba(232,83,74,0.3); box-shadow: 0 20px 50px rgba(232,83,74,0.14); }
        .fb-dish-card:hover .fb-dish-overlay { opacity: 1; }

        .fb-dish-img-wrap { position: relative; }
        .fb-dish-emoji {
          width: 100%; height: 180px;
          background: linear-gradient(145deg, #fff5f4, #fdecea);
          display: flex; align-items: center; justify-content: center;
          font-size: 80px;
        }
        .fb-dish-tag {
          position: absolute; top: 14px; left: 14px;
          background: linear-gradient(135deg, #e8534a, #c0392b);
          color: #fff; padding: 4px 12px; border-radius: 20px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;
          font-family: 'Sora', sans-serif;
        }
        .fb-dish-overlay {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(to top, rgba(232,83,74,0.92), transparent);
          padding: 20px; opacity: 0; transition: opacity 0.3s;
          text-align: center; color: #fff; font-weight: 700; font-size: 15px;
          font-family: 'Sora', sans-serif;
        }
        .fb-dish-body { padding: 18px 18px 20px; }
        .fb-dish-name { font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; font-family: 'Sora', sans-serif; }
        .fb-dish-row { display: flex; justify-content: space-between; align-items: center; }
        .fb-dish-price { font-size: 20px; font-weight: 800; color: #e8534a; font-family: 'Sora', sans-serif; }
        .fb-dish-meta { display: flex; gap: 10px; color: #bbb; font-size: 13px; align-items: center; font-family: 'Sora', sans-serif; }

        .fb-map-wrap {
          background: #fff;
          border-radius: 28px; border: 1px solid rgba(232,83,74,0.12);
          overflow: hidden; max-width: 1100px; margin: 0 auto;
          box-shadow: 0 8px 40px rgba(0,0,0,0.07);
        }
        .fb-map-header { padding: 36px 40px 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .fb-map-active {
          background: rgba(232,83,74,0.08); border: 1px solid rgba(232,83,74,0.25);
          border-radius: 12px; padding: 10px 20px;
          display: flex; align-items: center; gap: 8px;
          color: #e8534a; font-weight: 600; font-size: 13px; font-family: 'Sora', sans-serif;
        }

        .fb-footer {
          background: #fff; border-top: 1px solid rgba(232,83,74,0.1);
          padding: 40px 60px; display: flex;
          justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;
          font-family: 'Sora', sans-serif;
        }
        .fb-footer-copy { color: #bbb; font-size: 14px; }
        .fb-footer-links { display: flex; gap: 20px; }
        .fb-footer-link { color: #bbb; text-decoration: none; font-size: 14px; transition: color 0.2s; }
        .fb-footer-link:hover { color: #e8534a; }

        @keyframes fbFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes fbPulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #fef6f5; }
        ::-webkit-scrollbar-thumb { background: #e8534a; border-radius: 3px; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className={`fb-nav${scrolled ? " scrolled" : ""}`}>
        <Link to="/" className="fb-logo">
          <div className="fb-logo-icon">🍔</div>
          <span className="fb-logo-text">Fresh<span>Bite</span></span>
        </Link>
        <div className="fb-nav-links">
          <Link to="/" className="fb-link">Home</Link>
          <button className="fb-btn-menu" onClick={handleMenuClick}>Menu</button>

          <button className="fb-btn-sell" onClick={handleSellClick}>
            🏠 Start Selling
          </button>

          {loggedIn ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Link to="/profile" className="fb-nav-avatar" title="My Profile">
                {avatarLetter}
              </Link>
              <button className="fb-btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="fb-link">Login</Link>
              <Link to="/signup" className="fb-btn-signup">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="fb-hero">
        <div className="fb-hero-blob1" />
        <div className="fb-hero-blob2" />
        <div className="fb-hero-left">
          <div className="fb-badge">
            <span className="fb-glow-dot" /> Now delivering near you
          </div>
          <h1 className="fb-hero-h1">
            Homemade Food,<br />
            <span>Delivered Fresh</span>
          </h1>
          <p className="fb-hero-sub">
            Real chefs. Real ingredients. Straight to your doorstep in under 30 minutes.
          </p>
          <div className="fb-hero-btns">
            <button className="fb-cta-primary" onClick={handleMenuClick}>🍽️ Order Now</button>
            {loggedIn ? (
              <Link to="/profile" className="fb-cta-secondary">👤 My Account →</Link>
            ) : (
              <Link to="/signup" className="fb-cta-secondary">Join for Free →</Link>
            )}
          </div>

          <div className="sell-card" onClick={handleSellClick}>
            <div className="sell-card-icon">🏠</div>
            <div style={{ flex: 1 }}>
              <div className="sell-card-title">Cook from home? Start Selling!</div>
              <div className="sell-card-sub">Register your kitchen · Set your menu · Earn daily</div>
            </div>
            <div className="sell-card-arrow">→</div>
          </div>

          <div className="fb-stats">
            {[["10k+", "Happy Users"], ["50+", "Dishes"], ["4.9★", "Rating"]].map(([val, lbl]) => (
              <div key={lbl}>
                <div className="fb-stat-val">{val}</div>
                <div className="fb-stat-lbl">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="fb-hero-right">
          <div className="fb-hero-circle">🍛</div>
        </div>
      </div>

      {/* ── WHY FRESHBITE ── */}
      <div className="fb-section">
        <div className="fb-section-head">
          <div className="fb-badge">Our Promise</div>
          <h2 className="fb-section-h2">Why Choose <span>FreshBite?</span></h2>
        </div>
        <div className="fb-features">
          {[
            { icon: "🚚", title: "Lightning Fast", desc: "Delivered to your door in 30 minutes or less, guaranteed." },
            { icon: "📍", title: "Live Tracking", desc: "Watch your order travel in real time on the map." },
            { icon: "👨‍🍳", title: "Trusted Chefs", desc: "Every dish crafted by verified home chefs with love." },
            { icon: "⭐", title: "Top Rated", desc: "4.9★ average across 10,000+ happy customers." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="fb-feat-card">
              <div className="fb-feat-icon">{icon}</div>
              <div className="fb-feat-title">{title}</div>
              <div className="fb-feat-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── POPULAR DISHES ── */}
      <div className="fb-section" style={{ paddingTop: 0 }}>
        <div className="fb-section-head">
          <div className="fb-badge">🔥 Trending</div>
          <h2 className="fb-section-h2">Popular <span>Dishes</span></h2>
        </div>
        <div className="fb-dishes">
          {dishes.map((dish) => (
            <div key={dish.name} className="fb-dish-card" onClick={handleMenuClick}>
              <div className="fb-dish-img-wrap">
                <div className="fb-dish-emoji">{dish.emoji}</div>
                <div className="fb-dish-tag">{dish.tag}</div>
                <div className="fb-dish-overlay">+ Add to Cart</div>
              </div>
              <div className="fb-dish-body">
                <div className="fb-dish-name">{dish.name}</div>
                <div className="fb-dish-row">
                  <span className="fb-dish-price">{dish.price}</span>
                  <div className="fb-dish-meta">
                    <span>⭐ {dish.rating}</span>
                    <span>🕐 {dish.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SELL WITH US SECTION ── */}
      <div className="sell-section">
        <div className="sell-section-inner">
          <div className="sell-section-left">
            <div className="fb-badge" style={{ background: "rgba(249,115,22,0.1)", borderColor: "rgba(249,115,22,0.25)", color: "#f97316" }}>
              🏠 For Home Chefs
            </div>
            <h2 style={{
              fontSize: "38px", fontWeight: 800, letterSpacing: "-1px",
              color: "#1a1a1a", marginTop: "10px", marginBottom: "14px",
              fontFamily: "Sora, sans-serif", lineHeight: 1.2
            }}>
              Turn Your Kitchen<br />Into <span style={{ color: "#f97316" }}>Income</span>
            </h2>
            <p style={{ color: "#999", fontSize: "16px", lineHeight: 1.7, fontFamily: "Sora, sans-serif", maxWidth: "340px" }}>
              Join hundreds of home chefs already earning from their passion.
              No restaurant needed — just great food and a love for cooking.
            </p>
            <div style={{ display: "flex", gap: "28px", marginTop: "24px" }}>
              {[["500+", "Home Chefs"], ["₹15k", "Avg Monthly"], ["4.8★", "Chef Rating"]].map(([val, lbl]) => (
                <div key={lbl}>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#f97316", fontFamily: "Sora, sans-serif" }}>{val}</div>
                  <div style={{ fontSize: "12px", color: "#aaa", marginTop: "2px", fontFamily: "Sora, sans-serif" }}>{lbl}</div>
                </div>
              ))}
            </div>
            <button className="sell-cta-btn" onClick={handleSellClick}>
              🚀 Start Selling Today
            </button>
          </div>

          <div className="sell-section-right">
            {[
              { num: "1", icon: "📍", title: "Set Your Location", desc: "Register your home kitchen and set your GPS location for accurate delivery pricing." },
              { num: "2", icon: "🍱", title: "Add Your Menu", desc: "List your signature dishes with prices, photos and availability." },
              { num: "3", icon: "🎁", title: "Set First Order Discount", desc: "Attract new buyers with a special discount on their first order from you." },
              { num: "4", icon: "💰", title: "Start Earning", desc: "Receive orders, cook with love, and get paid directly to your account." },
            ].map((step) => (
              <div key={step.num} className="sell-step-card">
                <div className="sell-step-num">{step.num}</div>
                <div>
                  <div className="sell-step-title">{step.icon} {step.title}</div>
                  <div className="sell-step-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAP ── */}
      <div className="fb-section" style={{ paddingTop: 0 }}>
        <div className="fb-map-wrap">
          <div className="fb-map-header">
            <div>
              <div className="fb-badge">📍 Live Map</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.5px", fontFamily: "'Sora', sans-serif" }}>
                Your Delivery Zone
              </h2>
              <p style={{ color: "#aaa", fontSize: 14, marginTop: 6, fontFamily: "'Sora', sans-serif" }}>
                We deliver to your exact location in real time
              </p>
            </div>
            {mapLoaded && (
              <div className="fb-map-active">
                <span className="fb-glow-dot" /> Location Active
              </div>
            )}
          </div>
          <div id="map" style={{ width: "100%", height: 400 }} />
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="fb-footer">
        <Link to="/" className="fb-logo">
          <div className="fb-logo-icon">🍔</div>
          <span className="fb-logo-text">Fresh<span>Bite</span></span>
        </Link>
        <p className="fb-footer-copy">© 2026 FreshBite · Made with ❤️</p>
        <div className="fb-footer-links">
          {["Privacy", "Terms", "Contact"].map((l) => (
            <a key={l} href="#" className="fb-footer-link">{l}</a>
          ))}
        </div>
      </footer>
    </>
  );
}

export default Home;