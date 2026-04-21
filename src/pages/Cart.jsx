import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  getCartKey,
  getCart,
  saveCart,
  migrateCart,
} from "../utils/cartUtils";

const API_BASE = "http://localhost:5000/api";

const RESTAURANT_LAT = 17.385;
const RESTAURANT_LNG = 78.4867;
const RATE_PER_KM = 5;
const MIN_DELIVERY_FEE = 20;
const FREE_DELIVERY_ABOVE = 500;

const UPI_APPS = [
  {
    id: "phonepe",
    label: "PhonePe",
    color: "#5f259f",
    emoji: "💜",
    webUrl: "https://www.phonepe.com",
    deepLink: "phonepe://pay",
  },
  {
    id: "gpay",
    label: "GPay",
    color: "#1a73e8",
    emoji: "🔵",
    webUrl: "https://pay.google.com",
    deepLink: "tez://upi/pay",
  },
  {
    id: "paytm",
    label: "Paytm",
    color: "#00b9f1",
    emoji: "🔷",
    webUrl: "https://paytm.com",
    deepLink: "paytmmp://pay",
  },
  {
    id: "bhim",
    label: "BHIM",
    color: "#e8534a",
    emoji: "🇮🇳",
    webUrl: "https://www.bhimupi.org.in",
    deepLink: "upi://pay",
  },
];

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState(null);

  const [locationStatus, setLocationStatus] = useState("idle");
  const [distance, setDistance] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [userCoords, setUserCoords] = useState(null);

  const [showCheckout, setShowCheckout] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const [selectedUpiApp, setSelectedUpiApp] = useState("");
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    setCart(migrateCart());
  }, []);

  const updateQty = (i, change) => {
    const updated = [...cart];
    updated[i].quantity += change;
    if (updated[i].quantity <= 0) updated.splice(i, 1);
    setCart(updated);
    saveCart(updated);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gst = Math.round(subtotal * 0.05);
  const effectiveDeliveryFee =
    subtotal >= FREE_DELIVERY_ABOVE ? 0 : (deliveryFee ?? 0);
  const grandTotal = subtotal + gst + effectiveDeliveryFee;

  const detectLocation = () => {
    if (!navigator.geolocation) {
      showToast("GPS not supported.", "error");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        const dist = getDistanceKm(RESTAURANT_LAT, RESTAURANT_LNG, latitude, longitude);
        const fee = Math.max(MIN_DELIVERY_FEE, Math.round(dist * RATE_PER_KM));
        setDistance(dist.toFixed(1));
        setDeliveryFee(fee);
        setLocationStatus("success");
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const addr = data.address;
          setUserAddress(
            [addr.suburb || addr.neighbourhood, addr.city || addr.town, addr.state]
              .filter(Boolean)
              .join(", ")
          );
        } catch {
          setUserAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        showToast(`📍 Location detected! ${dist.toFixed(1)} km away`, "success");
      },
      () => {
        setLocationStatus("error");
        showToast("Location denied. Allow GPS.", "error");
      },
      { timeout: 10000 }
    );
  };

  // Fixed: mobile uses deep link, desktop opens website
  const handleOpenUpiApp = (app) => {
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

    if (isMobile) {
      const deepLinks = {
        phonepe: `phonepe://pay?pa=${upiId}&pn=FreshBite&am=${grandTotal}&cu=INR&tn=FreshBite%20Order`,
        gpay: `tez://upi/pay?pa=${upiId}&pn=FreshBite&am=${grandTotal}&cu=INR&tn=FreshBite%20Order`,
        paytm: `paytmmp://pay?pa=${upiId}&pn=FreshBite&am=${grandTotal}&cu=INR&tn=FreshBite%20Order`,
        bhim: `upi://pay?pa=${upiId}&pn=FreshBite&am=${grandTotal}&cu=INR&tn=FreshBite%20Order`,
      };
      window.location.href = deepLinks[app.id];
    } else {
      window.open(app.webUrl, "_blank");
    }
  };

  const placeOrder = async () => {
    if (!paymentMethod) {
      showToast("Please select a payment method!", "error");
      return;
    }
    if (paymentMethod === "upi" && !upiId.trim()) {
      showToast("Enter your UPI ID!", "error");
      return;
    }
    if (paymentMethod === "card" && (!cardNumber || !cardExpiry || !cardCvv)) {
      showToast("Fill in all card details!", "error");
      return;
    }
    if (locationStatus !== "success") {
      showToast("Please detect your location first!", "error");
      return;
    }

    setPlacing(true);
    try {
      const selectedSellerId = Number(localStorage.getItem("selectedSellerId"));
      const normalizedItems = cart.map((item) => ({
        ...item,
        seller_id:
          item.seller_id ??
          item.sellerId ??
          (Number.isFinite(selectedSellerId) && selectedSellerId > 0 ? selectedSellerId : null),
      }));

      let userId = 1;
      try {
        const userRaw = localStorage.getItem("user");
        if (userRaw) {
          const parsed = JSON.parse(userRaw);
          userId = parsed?.id || parsed?.user_id || parsed?._id || 1;
        }
      } catch { /* keep default */ }

      const payload = {
        user_id: userId,
        items: normalizedItems,
        subtotal,
        gst,
        delivery_fee: effectiveDeliveryFee,
        total_amount: grandTotal,
        distance_km: parseFloat(distance),
        delivery_address: userAddress,
        custom_note: customNote,
        payment_method: paymentMethod,
        pickup_lat: userCoords?.lat,
        pickup_lng: userCoords?.lng,
        pickup_area: userAddress,
        seller_id:
          Number.isFinite(selectedSellerId) && selectedSellerId > 0
            ? selectedSellerId
            : null,
      };

      const res = await fetch(`${API_BASE}/orders/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || data.message || `Server error ${res.status}`);

      localStorage.removeItem(getCartKey());
      localStorage.removeItem("cart_guest");
      localStorage.removeItem("cart");
      setCart([]);
      setPlacedOrderId(data.order_id);
      setOrderPlaced(true);
      showToast("🎉 Order placed successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to place order.", "error");
    } finally {
      setPlacing(false);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const selectedAppData = UPI_APPS.find((a) => a.id === selectedUpiApp);

  if (orderPlaced) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
          body { background: #fef6f5; font-family: 'Sora', sans-serif; margin: 0; }
          .success-wrap {
            min-height: 100vh; display: flex; flex-direction: column;
            align-items: center; justify-content: center; padding: 40px 20px; text-align: center;
          }
          .success-icon {
            width: 100px; height: 100px; background: linear-gradient(135deg,#4caf50,#2e7d32);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-size: 44px; margin: 0 auto 24px;
            animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1);
          }
          @keyframes popIn { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
          .success-title   { font-size: 28px; font-weight: 800; color: #1a1a1a; margin-bottom: 10px; }
          .success-sub     { color: #888; font-size: 15px; margin-bottom: 6px; }
          .success-orderid { font-size: 13px; color: #aaa; margin-bottom: 30px; }
          .success-btn {
            padding: 13px 32px; border-radius: 30px; border: none;
            background: linear-gradient(135deg,#e8534a,#f97316);
            color: white; font-weight: 700; font-size: 15px; cursor: pointer;
            font-family: 'Sora', sans-serif; margin: 6px;
            box-shadow: 0 6px 20px rgba(232,83,74,0.3);
          }
          .success-btn-ghost {
            padding: 13px 32px; border-radius: 30px;
            border: 2px solid #e8534a; background: transparent;
            color: #e8534a; font-weight: 700; font-size: 15px; cursor: pointer;
            font-family: 'Sora', sans-serif; margin: 6px;
          }
        `}</style>
        <div className="success-wrap">
          <div className="success-icon">✓</div>
          <div className="success-title">Order Placed! 🎉</div>
          <div className="success-sub">Your food is being prepared by a home cook near you.</div>
          {placedOrderId && <div className="success-orderid">Order ID: #{placedOrderId}</div>}
          <div>
            <button className="success-btn" onClick={() => navigate("/profile")}>View in Profile →</button>
            <button className="success-btn-ghost" onClick={() => navigate("/menu")}>Order More</button>
          </div>
          {placedOrderId && (
            <button
              className="success-btn-ghost"
              style={{ marginTop: "8px" }}
              onClick={() => navigate(`/delivery/${placedOrderId}`)}
            >
              🚴 Track Delivery
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        body { background: #fef6f5; font-family: 'Sora', sans-serif; margin: 0; }
        .debug-bar {
          background: #1a1a2e; color: #00ff88; font-size: 11px;
          font-family: monospace; padding: 6px 16px; text-align: center; position: relative; z-index: 1001;
        }
        .cart-nav {
          position: fixed; top: 28px; left: 0; right: 0; height: 64px;
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 48px;
          background: rgba(255,255,255,0.95); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(232,83,74,0.1); z-index: 1000;
          box-shadow: 0 2px 20px rgba(0,0,0,0.06);
        }
        .cart-logo { font-weight: 800; font-size: 22px; color: #1a1a1a; text-decoration: none; }
        .cart-logo span { color: #e8534a; }
        .cart-nav a { text-decoration: none; color: #555; font-weight: 600; font-size: 14px; }
        .cart-nav a:hover { color: #e8534a; }
        .cart-hero {
          background: linear-gradient(135deg, #e8534a 0%, #f97316 100%);
          padding: 120px 20px 70px; text-align: center; color: white;
          position: relative; overflow: hidden;
        }
        .cart-hero::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at 25% 60%, rgba(255,255,255,0.1) 0%, transparent 55%),
                      radial-gradient(circle at 75% 20%, rgba(255,255,255,0.07) 0%, transparent 45%);
        }
        .cart-hero h1 { font-size: 38px; font-weight: 800; margin: 0 0 8px; position: relative; }
        .cart-hero p  { color: rgba(255,255,255,0.85); margin: 0; font-size: 15px; position: relative; }
        .cart-container { max-width: 720px; margin: -36px auto 60px; padding: 0 20px; }
        .cart-card {
          background: white; border-radius: 18px; padding: 18px 22px; margin-bottom: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          display: flex; justify-content: space-between; align-items: center;
          transition: transform 0.2s, box-shadow 0.2s; gap: 12px;
        }
        .cart-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }
        .cart-item-name     { font-weight: 700; font-size: 15px; color: #1a1a1a; }
        .cart-item-category { font-size: 11px; color: #aaa; margin-top: 2px; }
        .cart-price { color: #e8534a; font-weight: 700; font-size: 15px; white-space: nowrap; }
        .cart-qty   { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .cart-btn {
          background: linear-gradient(135deg, #e8534a, #f97316);
          border: none; color: white; width: 30px; height: 30px;
          border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; transition: transform 0.15s;
        }
        .cart-btn:hover { transform: scale(1.1); }
        .cart-qty span { font-weight: 700; font-size: 16px; min-width: 20px; text-align: center; }
        .cart-thumb { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
        .section-card {
          background: white; border-radius: 18px; padding: 22px 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 14px;
        }
        .section-title { font-weight: 700; font-size: 16px; color: #1a1a1a; margin: 0 0 14px; }
        .gps-btn {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none; border-radius: 30px; color: white;
          font-weight: 700; font-size: 14px; cursor: pointer;
          font-family: 'Sora', sans-serif; transition: all 0.25s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .gps-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(102,126,234,0.4); }
        .gps-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .location-info {
          margin-top: 14px; padding: 14px 18px; background: #f0fdf4;
          border-radius: 12px; border: 1px solid #bbf7d0;
        }
        .location-info-row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 13px; margin-bottom: 6px;
        }
        .location-info-row:last-child { margin-bottom: 0; }
        .location-label { color: #666; }
        .location-value { font-weight: 700; color: #1a1a1a; }
        .free-delivery-badge {
          background: linear-gradient(135deg, #4caf50, #2e7d32);
          color: white; font-size: 11px; padding: 3px 10px;
          border-radius: 20px; font-weight: 700; margin-left: 8px;
        }
        .progress-bar-wrap { margin-top: 10px; background: #f0f0f0; border-radius: 10px; overflow: hidden; height: 6px; }
        .progress-bar-fill {
          height: 100%; background: linear-gradient(90deg,#4caf50,#81c784);
          border-radius: 10px; transition: width 0.5s ease;
        }
        .progress-label { font-size: 11px; color: #888; margin-top: 5px; text-align: center; }
        .proceed-btn {
          width: 100%; padding: 16px; border: none; border-radius: 30px;
          background: linear-gradient(135deg, #e8534a, #c0392b);
          color: white; font-weight: 800; font-size: 16px; cursor: pointer;
          font-family: 'Sora', sans-serif; margin-top: 6px;
          box-shadow: 0 6px 20px rgba(232,83,74,0.35); transition: all 0.25s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .proceed-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(232,83,74,0.45); }
        .custom-textarea {
          width: 100%; min-height: 100px; padding: 14px;
          border: 2px solid #f0f0f0; border-radius: 12px;
          font-family: 'Sora', sans-serif; font-size: 14px; color: #1a1a1a;
          resize: vertical; outline: none; transition: border-color 0.2s; box-sizing: border-box;
        }
        .custom-textarea:focus { border-color: #e8534a; }
        .custom-hint { font-size: 11px; color: #bbb; margin-top: 6px; }
        .payment-options { display: flex; flex-direction: column; gap: 10px; }
        .payment-option {
          border: 2px solid #f0f0f0; border-radius: 14px; padding: 14px 18px;
          cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 12px;
        }
        .payment-option:hover    { border-color: #e8534a; background: #fff5f5; }
        .payment-option.selected { border-color: #e8534a; background: #fff5f5; }
        .payment-icon  { font-size: 24px; flex-shrink: 0; }
        .payment-label { font-weight: 700; font-size: 14px; color: #1a1a1a; }
        .payment-sub   { font-size: 11px; color: #aaa; margin-top: 2px; }
        .payment-radio {
          margin-left: auto; width: 18px; height: 18px;
          border-radius: 50%; border: 2px solid #ddd;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .payment-radio.checked { border-color: #e8534a; background: #e8534a; }
        .payment-radio.checked::after { content:''; width:6px; height:6px; background:white; border-radius:50%; }
        .pay-input {
          width: 100%; padding: 12px 16px; border: 2px solid #f0f0f0;
          border-radius: 10px; font-family: 'Sora', sans-serif; font-size: 14px;
          color: #1a1a1a; outline: none; transition: border-color 0.2s; margin-top: 10px;
          box-sizing: border-box;
        }
        .pay-input:focus { border-color: #e8534a; }
        .pay-row { display: flex; gap: 10px; margin-top: 10px; }
        .pay-row .pay-input { margin-top: 0; }
        .bill-row {
          display: flex; justify-content: space-between;
          font-size: 14px; color: #555; margin-bottom: 10px;
        }
        .bill-row.total {
          font-size: 18px; font-weight: 800; color: #1a1a1a;
          border-top: 2px dashed #f0f0f0; padding-top: 12px; margin-top: 4px;
        }
        .bill-row .green { color: #4caf50; font-weight: 700; }
        .bill-row .red   { color: #e8534a; font-weight: 700; }
        .place-order-btn {
          width: 100%; padding: 16px; border: none; border-radius: 30px;
          background: linear-gradient(135deg, #4caf50, #2e7d32);
          color: white; font-weight: 800; font-size: 16px; cursor: pointer;
          font-family: 'Sora', sans-serif; margin-top: 14px;
          box-shadow: 0 6px 20px rgba(76,175,80,0.35); transition: all 0.25s;
        }
        .place-order-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(76,175,80,0.45); }
        .place-order-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .empty {
          text-align: center; padding: 80px 20px; color: #bbb;
          background: white; border-radius: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .empty h3 { font-size: 20px; color: #ccc; margin-bottom: 10px; }
        .toast {
          position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
          padding: 12px 24px; border-radius: 30px; font-weight: 600; font-size: 14px;
          z-index: 9999; box-shadow: 0 8px 30px rgba(0,0,0,0.15); animation: slideUp 0.3s ease;
        }
        .toast-success { background: #4caf50; color: white; }
        .toast-error   { background: #e8534a; color: white; }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .pulse { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .upi-app-btn {
          padding: 12px 18px; border-radius: 14px; cursor: pointer;
          font-weight: 700; font-size: 13px; font-family: 'Sora', sans-serif;
          transition: all 0.2s; display: flex; flex-direction: column;
          align-items: center; gap: 6px; min-width: 78px; border: 2px solid #f0f0f0;
          background: white; color: #555;
        }
        .upi-app-btn:hover { transform: translateY(-3px); box-shadow: 0 6px 18px rgba(0,0,0,0.1); }
        .upi-app-btn.active { transform: translateY(-3px); }
        .upi-app-emoji { font-size: 28px; }
        .qr-box {
          margin-top: 16px; padding: 28px 24px; background: white;
          border-radius: 20px; border: 2px solid #e0d4f7; text-align: center;
          box-shadow: 0 8px 30px rgba(102,126,234,0.15);
          animation: fadeInUp 0.35s cubic-bezier(0.34,1.3,0.64,1);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .open-app-btn {
          display: inline-block; margin-top: 16px; padding: 13px 30px;
          border-radius: 30px; color: white; font-weight: 700; font-size: 14px;
          text-decoration: none; cursor: pointer; border: none;
          font-family: 'Sora', sans-serif; transition: all 0.2s;
        }
        .open-app-btn:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 8px 22px rgba(0,0,0,0.2); }
        .change-app-link {
          background: none; border: none; color: #aaa; font-size: 12px;
          cursor: pointer; font-family: 'Sora', sans-serif;
          text-decoration: underline; margin-top: 12px; display: inline-block;
        }
      `}</style>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="debug-bar">
        🔑 Cart key: <strong>{getCartKey()}</strong> &nbsp;|&nbsp;
        Items in storage:{" "}
        <strong>{JSON.parse(localStorage.getItem(getCartKey()) || "[]").length}</strong>
        &nbsp;|&nbsp; User:{" "}
        <strong>{localStorage.getItem("user") ? "logged in" : "NOT logged in (guest)"}</strong>
      </div>

      <div className="cart-nav">
        <Link to="/" className="cart-logo">Fresh<span>Bite</span></Link>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <Link to="/menu">Menu</Link>
        </div>
      </div>

      <div className="cart-hero">
        <h1>Your Cart 🛒</h1>
        <p>Review your picks, customise &amp; checkout</p>
      </div>

      <div className="cart-container">
        {cart.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add some delicious items from our menu!</p>
            <button
              onClick={() => navigate("/menu")}
              style={{
                marginTop: "16px", padding: "10px 28px", borderRadius: "30px",
                border: "none", background: "linear-gradient(135deg,#e8534a,#f97316)",
                color: "white", fontWeight: 700, cursor: "pointer",
                fontSize: "14px", fontFamily: "'Sora',sans-serif",
              }}
            >
              Browse Menu →
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: "13px", color: "#999", marginBottom: "14px", fontWeight: 600 }}>
              {cart.length} item{cart.length > 1 ? "s" : ""} in your cart
            </div>

            {cart.map((item, i) => (
              <div className="cart-card" key={i}>
                {item.image && <img src={item.image} alt={item.name} className="cart-thumb" />}
                <div style={{ flex: 1 }}>
                  <div className="cart-item-name">{item.name}</div>
                  {item.category && <div className="cart-item-category">{item.category}</div>}
                  <div className="cart-price">₹{item.price}</div>
                </div>
                <div className="cart-qty">
                  <button className="cart-btn" onClick={() => updateQty(i, -1)}>−</button>
                  <span>{item.quantity}</span>
                  <button className="cart-btn" onClick={() => updateQty(i, 1)}>+</button>
                </div>
                <div className="cart-price" style={{ minWidth: "70px", textAlign: "right" }}>
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))}

            {/* Location */}
            <div className="section-card">
              <div className="section-title">📍 Delivery Location &amp; Fee</div>
              <button className="gps-btn" onClick={detectLocation} disabled={locationStatus === "loading"}>
                {locationStatus === "loading" ? (
                  <span className="pulse">🌐 Detecting your location…</span>
                ) : locationStatus === "success" ? "🔄 Re-detect Location" : "📡 Detect My Location (GPS)"}
              </button>
              {locationStatus === "success" && (
                <div className="location-info">
                  <div className="location-info-row">
                    <span className="location-label">📍 Your Area</span>
                    <span className="location-value" style={{ fontSize: "12px", maxWidth: "200px", textAlign: "right" }}>
                      {userAddress || "Location detected"}
                    </span>
                  </div>
                  <div className="location-info-row">
                    <span className="location-label">📏 Distance</span>
                    <span className="location-value">{distance} km</span>
                  </div>
                  <div className="location-info-row">
                    <span className="location-label">🛵 Delivery Fee</span>
                    <span className="location-value">
                      {subtotal >= FREE_DELIVERY_ABOVE ? (
                        <><s style={{ color: "#aaa", fontWeight: 400 }}>₹{deliveryFee}</s><span className="free-delivery-badge">FREE</span></>
                      ) : (
                        <>₹{deliveryFee} <span style={{ color: "#888", fontWeight: 400, fontSize: "11px" }}>(@₹{RATE_PER_KM}/km)</span></>
                      )}
                    </span>
                  </div>
                  {subtotal < FREE_DELIVERY_ABOVE && (
                    <>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar-fill" style={{ width: `${Math.min((subtotal / FREE_DELIVERY_ABOVE) * 100, 100)}%` }} />
                      </div>
                      <div className="progress-label">Add ₹{FREE_DELIVERY_ABOVE - subtotal} more for FREE delivery 🎉</div>
                    </>
                  )}
                </div>
              )}
              {locationStatus === "error" && (
                <div style={{ marginTop: "12px", padding: "12px 16px", background: "#fff5f5", borderRadius: "10px", border: "1px solid #fecaca", fontSize: "13px", color: "#e8534a" }}>
                  ❌ Location denied. Allow GPS in browser settings and try again.
                </div>
              )}
              {locationStatus === "idle" && (
                <div style={{ marginTop: "10px", fontSize: "12px", color: "#aaa", textAlign: "center" }}>
                  Click above to auto-detect your location and calculate delivery fee
                </div>
              )}
            </div>

            {/* Bill Summary */}
            <div className="section-card">
              <div className="section-title">🧾 Bill Summary</div>
              <div className="bill-row"><span>Item Total</span><span>₹{subtotal}</span></div>
              <div className="bill-row"><span>GST (5%)</span><span>₹{gst}</span></div>
              <div className="bill-row">
                <span>Delivery Fee</span>
                {locationStatus !== "success" ? (
                  <span style={{ color: "#aaa", fontSize: "12px" }}>Detect location first</span>
                ) : effectiveDeliveryFee === 0 ? (
                  <span className="green">FREE 🎉</span>
                ) : (
                  <span className="red">₹{effectiveDeliveryFee}</span>
                )}
              </div>
              <div className="bill-row total">
                <span>Grand Total</span>
                <span style={{ color: "#e8534a" }}>
                  ₹{locationStatus === "success" ? grandTotal : subtotal + gst}
                  {locationStatus !== "success" && <span style={{ fontSize: "11px", color: "#aaa", fontWeight: 400 }}> + delivery</span>}
                </span>
              </div>
              {!showCheckout && (
                <button
                  className="proceed-btn"
                  onClick={() => {
                    if (locationStatus !== "success") { showToast("Detect your location first!", "error"); return; }
                    setShowCheckout(true);
                    setTimeout(() => document.getElementById("checkout-section")?.scrollIntoView({ behavior: "smooth" }), 100);
                  }}
                >
                  🍱 Proceed to Checkout →
                </button>
              )}
              {!showCheckout && (
                <button
                  onClick={() => navigate("/menu")}
                  style={{
                    width: "100%", padding: "12px", marginTop: "10px",
                    border: "2px solid #e8534a", borderRadius: "30px",
                    background: "transparent", color: "#e8534a", fontWeight: 700,
                    cursor: "pointer", fontSize: "14px", fontFamily: "'Sora',sans-serif", transition: "all 0.25s",
                  }}
                >
                  + Add More Items
                </button>
              )}
            </div>

            {showCheckout && (
              <div id="checkout-section">
                {/* Custom Note */}
                <div className="section-card">
                  <div className="section-title">✏️ Customise Your Order</div>
                  <p style={{ fontSize: "13px", color: "#888", margin: "0 0 12px" }}>
                    Tell the home cook any special instructions
                  </p>
                  <textarea
                    className="custom-textarea"
                    placeholder="e.g. Less spicy please 🌶️, extra gravy, no onions…"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    maxLength={300}
                  />
                  <div className="custom-hint">{customNote.length}/300 characters</div>
                </div>

                {/* Payment */}
                <div className="section-card">
                  <div className="section-title">💳 Choose Payment Method</div>
                  <div className="payment-options">

                    {/* ── UPI ── */}
                    <div
                      className={`payment-option ${paymentMethod === "upi" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("upi")}
                    >
                      <span className="payment-icon">📱</span>
                      <div>
                        <div className="payment-label">UPI Payment</div>
                        <div className="payment-sub">GPay, PhonePe, Paytm, BHIM</div>
                      </div>
                      <div className={`payment-radio ${paymentMethod === "upi" ? "checked" : ""}`} />
                    </div>

                    {paymentMethod === "upi" && (
                      <>
                        <input
                          className="pay-input"
                          placeholder="Enter your UPI ID (e.g. name@okicici)"
                          value={upiId}
                          onChange={(e) => { setUpiId(e.target.value); setShowQR(false); }}
                        />

                        {/* UPI App Buttons */}
                        <div style={{ marginTop: "16px" }}>
                          <div style={{ fontSize: "13px", color: "#888", marginBottom: "12px", fontWeight: 600 }}>
                            Choose UPI App to Pay:
                          </div>
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            {UPI_APPS.map((app) => (
                              <button
                                key={app.id}
                                className={`upi-app-btn ${selectedUpiApp === app.id ? "active" : ""}`}
                                onClick={() => {
                                  setSelectedUpiApp(app.id);
                                  setShowQR(false);
                                  if (!upiId.trim()) {
                                    showToast("Please enter your UPI ID first!", "error");
                                  }
                                }}
                                style={{
                                  borderColor: selectedUpiApp === app.id ? app.color : "#f0f0f0",
                                  background: selectedUpiApp === app.id ? `${app.color}12` : "white",
                                  color: selectedUpiApp === app.id ? app.color : "#555",
                                  boxShadow: selectedUpiApp === app.id ? `0 4px 14px ${app.color}30` : "none",
                                }}
                              >
                                <span className="upi-app-emoji">{app.emoji}</span>
                                <span>{app.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tip: app selected but no UPI ID */}
                        {selectedUpiApp && !upiId.trim() && (
                          <div style={{
                            marginTop: "12px", padding: "10px 16px", background: "#fffbf0",
                            border: "1px solid #fde68a", borderRadius: "10px",
                            fontSize: "13px", color: "#92400e"
                          }}>
                            ⬆️ Please enter your UPI ID above to generate QR
                          </div>
                        )}

                        {/* Generate QR Button — visible as soon as an app is selected */}
                        {selectedUpiApp && (
                          <button
                            onClick={() => {
                              if (!upiId.trim()) {
                                showToast("Enter your UPI ID first!", "error");
                                return;
                              }
                              setShowQR(true);
                            }}
                            style={{
                              width: "100%", marginTop: "16px", padding: "13px",
                              borderRadius: "30px", border: "none",
                              background: "linear-gradient(135deg, #667eea, #764ba2)",
                              color: "white", fontWeight: 700, fontSize: "14px",
                              cursor: "pointer", fontFamily: "'Sora', sans-serif",
                              boxShadow: "0 6px 18px rgba(102,126,234,0.35)",
                            }}
                          >
                            📲 Generate QR Code & Pay
                          </button>
                        )}

                        {/* QR Display */}
                        {showQR && upiId.trim() && selectedUpiApp && selectedAppData && (
                          <div className="qr-box">
                            {/* App badge */}
                            <div style={{
                              display: "inline-flex", alignItems: "center", gap: "8px",
                              background: `${selectedAppData.color}12`,
                              border: `1.5px solid ${selectedAppData.color}40`,
                              borderRadius: "30px", padding: "6px 16px", marginBottom: "16px",
                            }}>
                              <span style={{ fontSize: "18px" }}>{selectedAppData.emoji}</span>
                              <span style={{ fontSize: "13px", fontWeight: 700, color: selectedAppData.color }}>
                                Pay via {selectedAppData.label}
                              </span>
                            </div>

                            {/* QR Code */}
                            <div style={{
                              display: "inline-block", padding: "12px", background: "white",
                              borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                              border: `2px solid ${selectedAppData.color}30`,
                            }}>
                              <QRCodeSVG
                                value={`upi://pay?pa=${upiId}&pn=FreshBite&am=${grandTotal}&cu=INR&tn=FreshBite Order`}
                                size={190}
                                bgColor="#ffffff"
                                fgColor="#1a1a1a"
                                level="H"
                              />
                            </div>

                            <div style={{ marginTop: "14px", fontSize: "13px", color: "#555" }}>
                              Paying{" "}
                              <strong style={{ color: "#e8534a", fontSize: "16px" }}>₹{grandTotal}</strong>
                              {" "}to <strong>{upiId}</strong>
                            </div>

                            {/* Desktop vs Mobile CTA */}
                            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                              {/Android|iPhone|iPad/i.test(navigator.userAgent) ? (
                                // MOBILE: deep link opens the app directly
                                <button
                                  className="open-app-btn"
                                  onClick={() => handleOpenUpiApp(selectedAppData)}
                                  style={{ background: `linear-gradient(135deg, ${selectedAppData.color}ee, ${selectedAppData.color}bb)` }}
                                >
                                  {selectedAppData.emoji} Open {selectedAppData.label} App →
                                </button>
                              ) : (
                                // DESKTOP: step-by-step scan instructions
                                <div style={{
                                  background: "#f8f8ff",
                                  border: `1.5px solid ${selectedAppData.color}30`,
                                  borderRadius: "14px", padding: "14px 18px",
                                  fontSize: "13px", color: "#555",
                                  lineHeight: "1.7", textAlign: "left",
                                  width: "100%", boxSizing: "border-box"
                                }}>
                                  <div style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: "8px" }}>
                                    {selectedAppData.emoji} How to pay via {selectedAppData.label}:
                                  </div>
                                  <div>1. Open <strong>{selectedAppData.label}</strong> on your phone</div>
                                  <div>2. Tap <strong>Scan QR</strong> and scan the code above</div>
                                  <div>3. Confirm the <strong style={{ color: "#e8534a" }}>₹{grandTotal}</strong> payment</div>
                                  <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #eee" }}>
                                    Or pay on web:{" "}
                                    <a
                                      href={selectedAppData.webUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: selectedAppData.color, fontWeight: 700, textDecoration: "none" }}
                                    >
                                      {selectedAppData.webUrl.replace("https://", "")} ↗
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>

                            <br />
                            <button className="change-app-link" onClick={() => setShowQR(false)}>
                              ← Change UPI App
                            </button>
                            <div style={{ fontSize: "11px", color: "#ccc", marginTop: "6px" }}>
                              QR valid for this session only
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* ── Cash on Delivery ── */}
                    <div
                      className={`payment-option ${paymentMethod === "cod" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("cod")}
                    >
                      <span className="payment-icon">💵</span>
                      <div>
                        <div className="payment-label">Cash on Delivery</div>
                        <div className="payment-sub">Pay when your food arrives</div>
                      </div>
                      <div className={`payment-radio ${paymentMethod === "cod" ? "checked" : ""}`} />
                    </div>

                    {/* ── Card ── */}
                    <div
                      className={`payment-option ${paymentMethod === "card" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("card")}
                    >
                      <span className="payment-icon">💳</span>
                      <div>
                        <div className="payment-label">Credit / Debit Card</div>
                        <div className="payment-sub">Visa, Mastercard, Rupay</div>
                      </div>
                      <div className={`payment-radio ${paymentMethod === "card" ? "checked" : ""}`} />
                    </div>

                    {paymentMethod === "card" && (
                      <>
                        <input
                          className="pay-input"
                          placeholder="Card Number (16 digits)"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                          maxLength={16}
                        />
                        <div className="pay-row">
                          <input className="pay-input" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} maxLength={5} />
                          <input className="pay-input" placeholder="CVV" type="password" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.slice(0, 3))} maxLength={3} />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="section-card">
                  <div className="section-title">📋 Order Summary</div>
                  <div className="bill-row"><span>Item Total</span><span>₹{subtotal}</span></div>
                  <div className="bill-row"><span>GST (5%)</span><span>₹{gst}</span></div>
                  <div className="bill-row">
                    <span>Delivery Fee</span>
                    {effectiveDeliveryFee === 0 ? <span className="green">FREE 🎉</span> : <span className="red">₹{effectiveDeliveryFee}</span>}
                  </div>
                  {customNote && (
                    <div style={{ background: "#fffbf0", border: "1px solid #fde68a", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#92400e", margin: "10px 0" }}>
                      📝 Note: {customNote}
                    </div>
                  )}
                  {paymentMethod && (
                    <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#0369a1", margin: "10px 0" }}>
                      💳 Payment:{" "}
                      {paymentMethod === "upi" ? `UPI — ${upiId || "entered"}` : paymentMethod === "cod" ? "Cash on Delivery" : "Card Payment"}
                    </div>
                  )}
                  <div className="bill-row total">
                    <span>Grand Total</span>
                    <span style={{ color: "#e8534a" }}>₹{grandTotal}</span>
                  </div>
                  <button className="place-order-btn" onClick={placeOrder} disabled={placing}>
                    {placing ? "⏳ Placing Order…" : `✅ Place Order — ₹${grandTotal}`}
                  </button>
                  <button
                    onClick={() => setShowCheckout(false)}
                    style={{
                      width: "100%", padding: "11px", marginTop: "10px",
                      border: "2px solid #ddd", borderRadius: "30px",
                      background: "transparent", color: "#999", fontWeight: 600,
                      cursor: "pointer", fontSize: "13px", fontFamily: "'Sora',sans-serif",
                    }}
                  >
                    ← Back to Cart
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default Cart;