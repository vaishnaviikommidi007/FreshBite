import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

const STATUS_CONFIG = {
  pending:   { bg: "#fff8e7", color: "#c47f00", dot: "#f59e0b", label: "Pending",   icon: "⏳" },
  confirmed: { bg: "#e0f2fe", color: "#0369a1", dot: "#0ea5e9", label: "Confirmed", icon: "✅" },
  delivered: { bg: "#dcfce7", color: "#15803d", dot: "#22c55e", label: "Delivered", icon: "🎉" },
  cancelled: { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444", label: "Cancelled", icon: "✕"  },
};

const PAYMENT_ICON = { upi: "📱", cod: "💵", card: "💳" };

const MOTIVATIONAL_QUOTES = [
  { text: "Good food is the foundation of genuine happiness.", author: "Auguste Escoffier" },
  { text: "One cannot think well, love well, sleep well, if one has not dined well.", author: "Virginia Woolf" },
  { text: "Life is uncertain. Eat dessert first.", author: "Ernestine Ulmer" },
  { text: "Food is our common ground, a universal experience.", author: "James Beard" },
  { text: "The secret ingredient is always love. But also butter.", author: "Anonymous Chef" },
];

const ACHIEVEMENT_TIERS = [
  { min: 0,  max: 2,  label: "Newcomer",     icon: "🌱", color: "#64748b" },
  { min: 3,  max: 7,  label: "Regular",      icon: "⭐", color: "#f59e0b" },
  { min: 8,  max: 14, label: "Food Lover",   icon: "🍜", color: "#f97316" },
  { min: 15, max: 29, label: "Foodie",       icon: "👨‍🍳", color: "#e8534a" },
  { min: 30, max: Infinity, label: "Legend", icon: "🏆", color: "#8b5cf6" },
];

function getTier(orderCount) {
  return ACHIEVEMENT_TIERS.find(t => orderCount >= t.min && orderCount <= t.max) || ACHIEVEMENT_TIERS[0];
}

export default function Profile() {
  const navigate = useNavigate();
  const [user,     setUser]     = useState(null);
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [quote]    = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  const [activeTab, setActiveTab] = useState("all");
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [savingReviewFor, setSavingReviewFor] = useState(null);
  const [reviewMsgByOrder, setReviewMsgByOrder] = useState({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (!stored) { navigate("/login"); return; }
    setUser(stored);
    fetchOrders(stored.id);
  }, []);

  const fetchOrders = async (userId) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/orders/user/${userId}`);
      const data = await res.json();
      if (data.success) {
        const grouped = {};
        (data.orders || []).forEach(row => {
          const orderId = row.order_id || row.id;
          if (!orderId) return;

          if (!grouped[orderId]) {
            grouped[orderId] = {
              order_id:         orderId,
              total_amount:     row.total_amount,
              status:           row.status,
              created_at:       row.created_at,
              payment_method:   row.payment_method,
              custom_note:      row.custom_note,
              delivery_address: row.delivery_address,
              partner_name:     row.partner_name,
              partner_phone:    row.partner_phone,
              delivery_status:  row.delivery_status,
              rating:           row.rating != null ? Number(row.rating) : null,
              review_text:      row.review_text || "",
              items: [],
            };
          }

          if (grouped[orderId].rating == null && row.rating != null) {
            grouped[orderId].rating = Number(row.rating);
          }
          if (!grouped[orderId].review_text && row.review_text) {
            grouped[orderId].review_text = row.review_text;
          }

          if (Array.isArray(row.items) && row.items.length > 0) {
            row.items.forEach(item => {
              grouped[orderId].items.push({
                name:      item.name || item.item_name || "Item",
                category:  item.category,
                price:     Number(item.price || 0),
                quantity:  Number(item.quantity || 1),
                image_url: item.image_url || item.image || null,
              });
            });
          } else if (row.item_name || row.name) {
            grouped[orderId].items.push({
              name:      row.item_name || row.name,
              category:  row.category,
              price:     Number(row.price || 0),
              quantity:  Number(row.quantity || 1),
              image_url: row.image_url || row.image || null,
            });
          }
        });
        setOrders(
          Object.values(grouped).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        );
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  const setReviewMessage = (orderId, type, text) => {
    setReviewMsgByOrder(prev => ({ ...prev, [orderId]: { type, text } }));
    setTimeout(() => {
      setReviewMsgByOrder(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }, 3000);
  };

  const updateReviewDraft = (orderId, patch) => {
    setReviewDrafts(prev => {
      const current = prev[orderId] || { rating: 0, review_text: "" };
      return {
        ...prev,
        [orderId]: {
          ...current,
          ...patch,
        },
      };
    });
  };

  const submitReview = async (orderId) => {
    const draft = reviewDrafts[orderId];
    const userId = user?.id || user?.user_id;

    if (!userId) {
      setReviewMessage(orderId, "error", "Please login again to submit review.");
      return;
    }
    if (!draft?.rating || draft.rating < 1 || draft.rating > 5) {
      setReviewMessage(orderId, "error", "Please select a star rating.");
      return;
    }

    setSavingReviewFor(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          rating: draft.rating,
          review_text: draft.review_text || "",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to save review");
      }

      setOrders(prev => prev.map(o =>
        o.order_id === orderId
          ? {
              ...o,
              rating: Number(data.review?.rating || draft.rating),
              review_text: data.review?.review_text || draft.review_text || "",
            }
          : o
      ));
      setReviewMessage(orderId, "success", "Review saved successfully.");
    } catch (err) {
      setReviewMessage(orderId, "error", err.message || "Failed to save review.");
    } finally {
      setSavingReviewFor(null);
    }
  };

  const formatDate = (dt) => {
    if (!dt) return "";
    return new Date(dt).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const totalSpent   = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const deliveredCnt = orders.filter(o => o.status === "delivered").length;
  const tier         = getTier(orders.length);
  const nextTier     = ACHIEVEMENT_TIERS[ACHIEVEMENT_TIERS.indexOf(tier) + 1];
  const progressPct  = nextTier
    ? Math.min(100, Math.round(((orders.length - tier.min) / (nextTier.min - tier.min)) * 100))
    : 100;

  const filteredOrders = activeTab === "all"
    ? orders
    : orders.filter(o => o.status === activeTab);

  const favItem = (() => {
    const freq = {};
    orders.forEach(o => o.items.forEach(i => { freq[i.name] = (freq[i.name] || 0) + i.quantity; }));
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : null;
  })();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        :root {
          --red:    #e8534a;
          --orange: #f97316;
          --dark:   #1c1917;
          --mid:    #57534e;
          --light:  #fafaf9;
          --card:   #ffffff;
          --border: #e7e5e4;
          --radius: 20px;
        }

        body {
          background: var(--light);
          font-family: 'DM Sans', sans-serif;
          margin: 0; color: var(--dark);
        }

        /* ── NAV ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; height: 60px;
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 28px;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          z-index: 1000;
        }
        .logo { font-family: 'Playfair Display', serif; font-size: 20px; color: var(--dark); text-decoration: none; }
        .logo span { color: var(--red); }
        .nav-links { display: flex; gap: 16px; align-items: center; }
        .nav-links a { text-decoration: none; color: var(--mid); font-weight: 500; font-size: 14px; transition: color .2s; }
        .nav-links a:hover { color: var(--red); }
        .logout-btn {
          padding: 7px 16px; border-radius: 50px; border: 1.5px solid var(--border);
          background: transparent; color: var(--mid); font-weight: 600; font-size: 13px;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s;
        }
        .logout-btn:hover { border-color: var(--red); color: var(--red); }

        /* ── HERO ── */
        .hero {
          background: linear-gradient(135deg, #1c1917 0%, #292524 60%, #44403c 100%);
          padding: 100px 24px 80px; text-align: center; color: white; position: relative; overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute; top: -60px; left: -60px; right: -60px; bottom: -60px;
          background:
            radial-gradient(circle at 20% 80%, rgba(232,83,74,0.25) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(249,115,22,0.2)  0%, transparent 50%);
          pointer-events: none;
        }
        .avatar-wrap {
          position: relative; display: inline-flex; align-items: center;
          justify-content: center; margin-bottom: 20px;
        }
        .avatar {
          width: 86px; height: 86px; border-radius: 50%;
          background: linear-gradient(135deg, var(--red), var(--orange));
          display: flex; align-items: center; justify-content: center;
          font-size: 38px; border: 3px solid rgba(255,255,255,0.15);
          position: relative; z-index: 1;
          box-shadow: 0 8px 32px rgba(232,83,74,0.4);
        }
        .tier-badge {
          position: absolute; bottom: -4px; right: -4px;
          background: white; border-radius: 50%; width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; z-index: 2; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: 28px; font-weight: 800; margin: 0 0 6px; position: relative;
        }
        .hero-email { color: rgba(255,255,255,0.55); font-size: 13px; position: relative; }
        .hero-tier-label {
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 12px; padding: 5px 14px; border-radius: 50px;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
          font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.8); position: relative;
        }

        /* ── QUOTE BANNER ── */
        .quote-banner {
          background: linear-gradient(135deg, var(--red), var(--orange));
          color: white; padding: 18px 28px; text-align: center; position: relative;
        }
        .quote-banner blockquote {
          margin: 0; font-style: italic; font-size: 14px; line-height: 1.6;
          opacity: 0.95;
        }
        .quote-banner cite {
          display: block; margin-top: 6px; font-size: 11px; opacity: 0.75;
          font-style: normal; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
        }

        /* ── CONTAINER ── */
        .container { max-width: 740px; margin: 0 auto; padding: 32px 20px 80px; }

        /* ── STATS ROW ── */
        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
        .stat-card {
          background: var(--card); border-radius: var(--radius); padding: 20px 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05); text-align: center;
          border: 1px solid var(--border); transition: transform .2s;
        }
        .stat-card:hover { transform: translateY(-3px); }
        .stat-icon { font-size: 22px; margin-bottom: 6px; }
        .stat-num  { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 800; color: var(--red); }
        .stat-label{ font-size: 11px; color: #a8a29e; margin-top: 2px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }

        /* ── PROGRESS CARD ── */
        .progress-card {
          background: var(--dark); border-radius: var(--radius); padding: 22px 24px;
          margin-bottom: 28px; color: white; position: relative; overflow: hidden;
        }
        .progress-card::before {
          content: ''; position: absolute; right: -30px; top: -30px;
          width: 120px; height: 120px; border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%);
        }
        .progress-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;
        }
        .progress-title { font-family: 'Playfair Display', serif; font-size: 16px; }
        .progress-tier  { display: flex; align-items: center; gap: 6px; font-size: 13px; opacity: 0.75; }
        .progress-bar-bg {
          background: rgba(255,255,255,0.1); border-radius: 50px; height: 7px; overflow: hidden;
        }
        .progress-bar-fill {
          background: linear-gradient(90deg, var(--red), var(--orange));
          height: 100%; border-radius: 50px; transition: width 1s ease;
        }
        .progress-sub {
          margin-top: 10px; font-size: 12px; opacity: 0.55;
          display: flex; justify-content: space-between;
        }
        .fav-item-chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 50px; padding: 5px 12px; font-size: 12px; margin-top: 14px;
        }

        /* ── MOTIVATIONAL CTA ── */
        .cta-card {
          background: linear-gradient(135deg, #fff7ed, #fff1e6);
          border: 1.5px solid #fed7aa; border-radius: var(--radius);
          padding: 22px 24px; margin-bottom: 28px;
          display: flex; align-items: center; gap: 16px;
        }
        .cta-emoji { font-size: 42px; flex-shrink: 0; }
        .cta-text h3 {
          margin: 0 0 4px; font-family: 'Playfair Display', serif;
          font-size: 17px; color: #9a3412;
        }
        .cta-text p { margin: 0; font-size: 13px; color: #c2410c; line-height: 1.5; }
        .cta-btn {
          margin-left: auto; flex-shrink: 0;
          padding: 10px 20px; border-radius: 50px; border: none;
          background: linear-gradient(135deg, var(--red), var(--orange));
          color: white; font-weight: 600; font-size: 13px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all .2s; white-space: nowrap;
        }
        .cta-btn:hover { transform: scale(1.04); box-shadow: 0 4px 16px rgba(232,83,74,0.35); }

        /* ── SECTION HEADER ── */
        .sec-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
        }
        .sec-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; }

        /* ── TABS ── */
        .tab-row {
          display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .tab-btn {
          padding: 6px 16px; border-radius: 50px; font-size: 12px; font-weight: 600;
          border: 1.5px solid var(--border); background: transparent; cursor: pointer;
          font-family: 'DM Sans', sans-serif; color: var(--mid); transition: all .2s;
        }
        .tab-btn.active {
          background: var(--dark); border-color: var(--dark); color: white;
        }
        .tab-btn:hover:not(.active) { border-color: var(--red); color: var(--red); }

        /* ── ORDER CARDS ── */
        .order-card {
          background: var(--card); border-radius: var(--radius); margin-bottom: 14px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05); overflow: hidden;
          border: 1.5px solid var(--border); transition: box-shadow .2s, border-color .2s;
        }
        .order-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.09); border-color: #d6d3d1; }

        .order-header {
          padding: 18px 20px; display: flex; justify-content: space-between;
          align-items: flex-start; cursor: pointer; gap: 12px;
        }
        .order-id    { font-size: 11px; color: #a8a29e; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 3px; }
        .order-total { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--dark); }
        .order-date  { font-size: 11px; color: #d6d3d1; margin-top: 3px; }
        .order-right { display: flex; flex-direction: column; align-items: flex-end; gap: 7px; }

        .status-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 50px; font-size: 11px; font-weight: 700; white-space: nowrap;
        }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; }
        .expand-arrow { font-size: 11px; color: #d6d3d1; transition: transform .25s; }
        .expand-arrow.open { transform: rotate(180deg); }

        /* ── ORDER DETAIL ── */
        .order-detail { border-top: 1px solid #f5f5f4; padding: 18px 20px; animation: fadeDown .2s ease; }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        .items-list { margin-bottom: 14px; }
        .item-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 0; border-bottom: 1px solid #f5f5f4;
        }
        .item-row:last-child { border-bottom: none; }
        .item-img { width: 44px; height: 44px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
        .item-img-placeholder {
          width: 44px; height: 44px; border-radius: 10px; background: #f5f5f4;
          display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
        }
        .item-name { font-weight: 600; font-size: 13px; color: var(--dark); }
        .item-qty  { font-size: 12px; color: #a8a29e; margin-top: 1px; }
        .item-price{ margin-left: auto; font-weight: 700; font-size: 14px; color: var(--red); }

        .order-meta { display: flex; flex-direction: column; gap: 7px; margin-bottom: 12px; }
        .meta-row {
          display: flex; gap: 8px; font-size: 12px; color: #78716c; align-items: flex-start;
        }
        .meta-row strong { color: var(--mid); min-width: 88px; font-weight: 600; }

        .note-box {
          background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;
          padding: 10px 14px; font-size: 12px; color: #92400e; margin-bottom: 12px;
          display: flex; gap: 8px; align-items: flex-start;
        }

        .delivery-badge {
          padding: 3px 10px; border-radius: 50px; background: #f0fdf4;
          color: #16a34a; font-size: 11px; font-weight: 700;
          border: 1px solid #bbf7d0; margin-left: 8px;
        }

        .track-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 22px; border-radius: 50px;
          background: linear-gradient(135deg, var(--red), var(--orange));
          color: white; font-weight: 600; font-size: 12px; cursor: pointer;
          border: none; font-family: 'DM Sans', sans-serif; text-decoration: none;
          transition: all .2s;
        }
        .track-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(232,83,74,0.35); }

        .mini-review-btn {
          border: 1px solid #e7e5e4;
          background: #fff;
          color: #78716c;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }
        .mini-review-btn:hover {
          border-color: #e8534a;
          color: #e8534a;
        }

        .review-card {
          margin-top: 14px; padding: 12px; border-radius: 12px;
          border: 1px solid #e7e5e4; background: #fafaf9;
        }
        .review-title {
          font-size: 12px; font-weight: 700; color: #57534e; margin-bottom: 8px;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .stars-row { display: flex; gap: 4px; margin-bottom: 10px; }
        .star-btn {
          border: none; background: transparent; cursor: pointer;
          font-size: 22px; line-height: 1; padding: 0 2px;
          color: #d6d3d1; transition: transform .12s, color .12s;
        }
        .star-btn.active { color: #f59e0b; }
        .star-btn:hover { transform: translateY(-1px) scale(1.06); }
        .review-input {
          width: 100%; min-height: 78px; resize: vertical;
          border: 1.5px solid #e7e5e4; border-radius: 10px;
          padding: 10px 12px; font-family: 'DM Sans', sans-serif;
          font-size: 13px; color: #1c1917; background: white; outline: none;
        }
        .review-input:focus { border-color: #e8534a; }
        .review-actions {
          margin-top: 10px; display: flex; justify-content: space-between; align-items: center; gap: 10px;
        }
        .review-status {
          font-size: 12px; font-weight: 600;
        }
        .review-status.success { color: #15803d; }
        .review-status.error { color: #b91c1c; }
        .review-btn {
          border: none; border-radius: 999px; padding: 8px 14px;
          font-size: 12px; font-weight: 700; cursor: pointer; color: white;
          background: linear-gradient(135deg, #e8534a, #f97316);
          font-family: 'DM Sans', sans-serif;
        }
        .review-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .review-lock-note {
          margin-top: 8px; font-size: 12px; color: #a16207;
          background: #fffbeb; border: 1px solid #fde68a;
          border-radius: 8px; padding: 8px 10px;
        }

        /* ── EMPTY & LOADING ── */
        .empty-orders {
          text-align: center; padding: 70px 20px; background: var(--card);
          border-radius: var(--radius); box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          border: 1.5px solid var(--border);
        }
        .empty-orders h3 { font-family: 'Playfair Display', serif; font-size: 20px; margin: 16px 0 8px; }
        .empty-orders p  { color: #a8a29e; font-size: 14px; margin: 0 0 20px; }

        .browse-btn {
          display: inline-block; padding: 12px 32px; border-radius: 50px; border: none;
          background: linear-gradient(135deg, var(--red), var(--orange)); color: white;
          font-weight: 700; cursor: pointer; font-size: 14px; font-family: 'DM Sans', sans-serif;
          transition: all .2s;
        }
        .browse-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(232,83,74,0.35); }

        .loading-wrap { text-align: center; padding: 70px 20px; color: #a8a29e; font-size: 14px; }
        .spinner {
          width: 34px; height: 34px; border: 3px solid #f0f0f0;
          border-top-color: var(--red); border-radius: 50%;
          animation: spin 0.8s linear infinite; margin: 0 auto 14px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── RESPONSIVE ── */
        @media (max-width: 520px) {
          .stats-row { grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .cta-card   { flex-wrap: wrap; }
          .cta-btn    { margin-left: 0; width: 100%; }
          .hero h1    { font-size: 22px; }
        }
      `}</style>

      {/* NAV */}
      <div className="nav">
        <Link to="/" className="logo">Fresh<span>Bite</span></Link>
        <div className="nav-links">
          <Link to="/menu">Menu</Link>
          <Link to="/cart">Cart 🛒</Link>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </div>

      {/* HERO */}
      <div className="hero">
        <div className="avatar-wrap">
          <div className="avatar">👤</div>
          <div className="tier-badge">{tier.icon}</div>
        </div>
        <h1>{user?.name || user?.email || "My Profile"}</h1>
        <p className="hero-email">{user?.email}</p>
        <div className="hero-tier-label" style={{ color: tier.color }}>
          {tier.icon} &nbsp;{tier.label} Member
        </div>
      </div>

      {/* QUOTE BANNER */}
      <div className="quote-banner">
        <blockquote>"{quote.text}"</blockquote>
        <cite>— {quote.author}</cite>
      </div>

      <div className="container">

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">🛍️</div>
            <div className="stat-num">{orders.length}</div>
            <div className="stat-label">Total Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-num">{deliveredCnt}</div>
            <div className="stat-label">Delivered</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💸</div>
            <div className="stat-num">₹{(totalSpent / 1000).toFixed(1)}k</div>
            <div className="stat-label">Total Spent</div>
          </div>
        </div>

        {/* ACHIEVEMENT / PROGRESS CARD */}
        {!loading && (
          <div className="progress-card">
            <div className="progress-header">
              <div>
                <div className="progress-title">{tier.icon} {tier.label}</div>
              </div>
              {nextTier && (
                <div className="progress-tier">
                  {nextTier.icon} {nextTier.label} in {nextTier.min - orders.length} order{nextTier.min - orders.length !== 1 ? "s" : ""}
                </div>
              )}
              {!nextTier && <div className="progress-tier">🎖️ Max Tier Reached!</div>}
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="progress-sub">
              <span>{orders.length} orders placed</span>
              <span>{progressPct}% to next tier</span>
            </div>
            {favItem && (
              <div className="fav-item-chip">
                🍽️ Your go-to: <strong style={{ color: "white" }}>{favItem}</strong>
              </div>
            )}
          </div>
        )}

        {/* MOTIVATIONAL CTA */}
        {!loading && (
          <div className="cta-card">
            <div className="cta-emoji">🤤</div>
            <div className="cta-text">
              <h3>
                {orders.length === 0
                  ? "Your food journey starts here!"
                  : orders.length < 5
                  ? "You're just getting started — keep exploring!"
                  : `${orders.length} orders and still hungry for more?`}
              </h3>
              <p>
                {orders.length === 0
                  ? "Browse our fresh menu and place your very first order. Something delicious is waiting."
                  : "Great taste is one tap away. Try something new today!"}
              </p>
            </div>
            <button className="cta-btn" onClick={() => navigate("/menu")}>
              Order Now →
            </button>
          </div>
        )}

        {/* ORDERS SECTION */}
        <div className="sec-header">
          <div className="sec-title">Order History</div>
        </div>

        {/* FILTER TABS */}
        {!loading && orders.length > 0 && (
          <div className="tab-row">
            {["all", "pending", "confirmed", "delivered", "cancelled"].map(tab => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "all" ? `All (${orders.length})` : `${STATUS_CONFIG[tab]?.icon} ${tab.charAt(0).toUpperCase() + tab.slice(1)} (${orders.filter(o => o.status === tab).length})`}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="loading-wrap">
            <div className="spinner" />
            Loading your order history…
          </div>
        ) : filteredOrders.length === 0 && orders.length === 0 ? (
          <div className="empty-orders">
            <div style={{ fontSize: "56px" }}>🍽️</div>
            <h3>No orders yet</h3>
            <p>Explore our menu and treat yourself to something amazing today.</p>
            <button className="browse-btn" onClick={() => navigate("/menu")}>Browse Menu →</button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-orders">
            <div style={{ fontSize: "40px" }}>🔍</div>
            <h3 style={{ fontSize: "16px" }}>No {activeTab} orders</h3>
            <p>Try a different filter above.</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const sc     = STATUS_CONFIG[order.status] || { bg: "#f5f5f4", color: "#78716c", dot: "#a8a29e", icon: "•" };
            const isOpen = expanded === order.order_id;
            const normalizedStatus = String(order.status || "").toLowerCase();
            const canReview = normalizedStatus === "delivered";
            const reviewDraft = reviewDrafts[order.order_id] || {
              rating: order.rating || 0,
              review_text: order.review_text || "",
            };
            return (
              <div className="order-card" key={order.order_id}>
                <div className="order-header" onClick={() => setExpanded(isOpen ? null : order.order_id)}>
                  <div>
                    <div className="order-id">Order #{order.order_id}</div>
                    <div className="order-total">₹{Number(order.total_amount).toLocaleString("en-IN")}</div>
                    <div className="order-date">{formatDate(order.created_at)}</div>
                  </div>
                  <div className="order-right">
                    <span className="status-badge" style={{ background: sc.bg, color: sc.color }}>
                      <span className="status-dot" style={{ background: sc.dot }} />
                      {sc.label || order.status}
                    </span>
                    {order.payment_method && (
                      <span style={{ fontSize: "12px", color: "#a8a29e" }}>
                        {PAYMENT_ICON[order.payment_method]} {order.payment_method.toUpperCase()}
                      </span>
                    )}
                    {normalizedStatus !== "cancelled" && (
                      <button
                        type="button"
                        className="mini-review-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpanded(order.order_id);
                        }}
                      >
                        {Number(order.rating || 0) > 0
                          ? `⭐ ${Number(order.rating).toFixed(1)} Review`
                          : "⭐ Rate & Review"}
                      </button>
                    )}
                    <span className={`expand-arrow ${isOpen ? "open" : ""}`}>▼</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="order-detail">
                    <div className="items-list">
                      {order.items.map((item, idx) => (
                        <div className="item-row" key={idx}>
                          {item.image_url
                            ? <img src={item.image_url} alt={item.name} className="item-img" />
                            : <div className="item-img-placeholder">🍽️</div>}
                          <div>
                            <div className="item-name">{item.name}</div>
                            <div className="item-qty">× {item.quantity}</div>
                          </div>
                          <div className="item-price">₹{(item.price * item.quantity).toLocaleString("en-IN")}</div>
                        </div>
                      ))}
                    </div>

                    <div className="order-meta">
                      {order.delivery_address && (
                        <div className="meta-row">
                          <strong>📍 Delivery</strong>
                          {order.delivery_address}
                        </div>
                      )}
                      {order.partner_name && (
                        <div className="meta-row">
                          <strong>🚴 Partner</strong>
                          {order.partner_name} · {order.partner_phone}
                          {order.delivery_status && (
                            <span className="delivery-badge">{order.delivery_status}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {order.custom_note && (
                      <div className="note-box">
                        <span>📝</span>
                        <span><strong>Note:</strong> {order.custom_note}</span>
                      </div>
                    )}

                    {order.status !== "delivered" && order.status !== "cancelled" && (
                      <button className="track-btn" onClick={() => navigate(`/delivery/${order.order_id}`)}>
                        🚴 Track Delivery
                      </button>
                    )}

                    {normalizedStatus !== "cancelled" && (
                      <div className="review-card">
                        <div className="review-title">Rate & Review</div>
                        <div className="stars-row">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              className={`star-btn ${star <= Number(reviewDraft.rating || 0) ? "active" : ""}`}
                              onClick={() => canReview && updateReviewDraft(order.order_id, { rating: star })}
                              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                              disabled={!canReview}
                            >
                              ★
                            </button>
                          ))}
                        </div>

                        <textarea
                          className="review-input"
                          placeholder="Share your experience with this order..."
                          value={reviewDraft.review_text}
                          onChange={(e) => updateReviewDraft(order.order_id, { review_text: e.target.value })}
                          disabled={!canReview}
                        />

                        {!canReview && (
                          <div className="review-lock-note">
                            Review will be enabled after the order is delivered.
                          </div>
                        )}

                        <div className="review-actions">
                          <div className={`review-status ${reviewMsgByOrder[order.order_id]?.type || ""}`}>
                            {reviewMsgByOrder[order.order_id]?.text || " "}
                          </div>
                          <button
                            type="button"
                            className="review-btn"
                            disabled={savingReviewFor === order.order_id || !canReview}
                            onClick={() => submitReview(order.order_id)}
                          >
                            {savingReviewFor === order.order_id
                              ? "Saving..."
                              : order.rating
                              ? "Update Review"
                              : "Submit Review"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}