import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";

const API_BASE = "http://localhost:5000/api";
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

// ─── Safe price formatter (fixes ₹NaN) ────────────────────────────────────
export function formatPrice(price, quantity = 1) {
  const amount = parseFloat(price) * parseInt(quantity || 1);
  if (isNaN(amount)) return "0.00";
  return amount.toFixed(2);
}

// ─── Haversine distance ────────────────────────────────────────────────────
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Stage config ──────────────────────────────────────────────────────────
const STAGES = [
  { key: "confirmed",      label: "Confirmed",   icon: "✓" },
  { key: "cook_found",     label: "Cook found",  icon: "👩‍🍳" },
  { key: "preparing",      label: "Preparing",   icon: "🍳" },
  { key: "rider_assigned", label: "On the way",  icon: "🏍️" },
  { key: "delivered",      label: "Delivered",   icon: "✓" },
];

function stageIndex(status) {
  const map = {
    pending:          0,
    confirmed:        0,
    cook_found:       1,
    preparing:        2,
    rider_assigned:   3,
    out_for_delivery: 3,
    delivered:        4,
  };
  return map[status] ?? 0;
}

// ─── Google Maps modal ─────────────────────────────────────────────────────
const MAP_LIBRARIES = ["places"];

function DeliveryMapModal({ onClose, order, rider }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  });

  const [directions, setDirections] = useState(null);
  const [riderPos,   setRiderPos]   = useState(null);
  const [mapEta,     setMapEta]     = useState("Calculating…");

  // Default coords (Kokapet area) – replaced by real data when available
  const restaurantCoords = {
    lat: parseFloat(order?.restaurant_lat) || 17.3850,
    lng: parseFloat(order?.restaurant_lng) || 78.4867,
  };
  const customerCoords = {
    lat: parseFloat(order?.delivery_lat ?? order?.pickup_lat) || 17.3616,
    lng: parseFloat(order?.delivery_lng ?? order?.pickup_lng) || 78.3761,
  };
  const riderStartCoords = {
    lat: parseFloat(rider?.current_lat) || restaurantCoords.lat,
    lng: parseFloat(rider?.current_lng) || restaurantCoords.lng,
  };

  // Fetch route from Google Directions API
  useEffect(() => {
    if (!isLoaded) return;
    const svc = new window.google.maps.DirectionsService();
    svc.route(
      {
        origin:      riderStartCoords,
        destination: customerCoords,
        travelMode:  window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status !== "OK") return;
        setDirections(result);

        // ETA from Google
        setMapEta(result.routes[0].legs[0].duration.text);
      }
    );
  }, [isLoaded, riderStartCoords.lat, riderStartCoords.lng, customerCoords.lat, customerCoords.lng]);

  useEffect(() => {
    setRiderPos(riderStartCoords);
  }, [riderStartCoords.lat, riderStartCoords.lng]);

  const mapCenter = riderPos || riderStartCoords;

  return (
    <div className="map-overlay" onClick={onClose}>
      <div className="map-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="map-header">
          <div>
            <h2 className="map-title">🛵 Live Tracking</h2>
            <p className="map-eta">
              ETA: <strong>{mapEta}</strong>
              {rider?.name && <span className="map-rider-name"> · {rider.name}</span>}
            </p>
          </div>
          <button className="map-close" onClick={onClose}>✕</button>
        </div>

        {/* Map */}
        <div className="map-container">
          {!GOOGLE_MAPS_API_KEY ? (
            <div className="map-loading">
              <p className="dt-muted" style={{ margin: 0, textAlign: "center" }}>
                Add VITE_GOOGLE_MAPS_API_KEY in your .env file to enable live map.
              </p>
            </div>
          ) : !isLoaded ? (
            <div className="map-loading">
              <div className="dt-spinner" />
              <p>Loading map…</p>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={mapCenter}
              zoom={14}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: MAPS_STYLE,
              }}
            >
              {/* Route line */}
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: "#e8534a",
                      strokeWeight: 5,
                      strokeOpacity: 0.85,
                    },
                  }}
                />
              )}

              {/* Restaurant */}
              <Marker
                position={restaurantCoords}
                title="Restaurant"
                icon={{
                  url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="18" fill="#fff" stroke="#e8534a" stroke-width="2"/>
                      <text x="20" y="26" text-anchor="middle" font-size="18">🍽️</text>
                    </svg>`
                  ),
                  scaledSize: new window.google.maps.Size(40, 40),
                  anchor: new window.google.maps.Point(20, 20),
                }}
              />

              {/* Rider (animated) */}
              {riderPos && (
                <Marker
                  position={riderPos}
                  title="Your Rider"
                  icon={{
                    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
                      `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
                        <circle cx="22" cy="22" r="20" fill="#e8534a"/>
                        <text x="22" y="29" text-anchor="middle" font-size="20">🛵</text>
                      </svg>`
                    ),
                    scaledSize: new window.google.maps.Size(44, 44),
                    anchor: new window.google.maps.Point(22, 22),
                  }}
                />
              )}

              {/* Customer */}
              <Marker
                position={customerCoords}
                title="Your Location"
                icon={{
                  url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="18" fill="#4caf50"/>
                      <text x="20" y="26" text-anchor="middle" font-size="18">📍</text>
                    </svg>`
                  ),
                  scaledSize: new window.google.maps.Size(40, 40),
                  anchor: new window.google.maps.Point(20, 40),
                }}
              />
            </GoogleMap>
          )}
        </div>

        {/* Legend */}
        <div className="map-legend">
          <span>🍽️ Restaurant</span>
          <span className="map-legend-line">━━━━━</span>
          <span>🛵 Rider</span>
          <span className="map-legend-line">━━━━━</span>
          <span>📍 You</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function DeliveryTracking() {
  const { orderId } = useParams();
  const navigate    = useNavigate();

  const [order,    setOrder]    = useState(null);
  const [cook,     setCook]     = useState(null);
  const [rider,    setRider]    = useState(null);
  const [status,   setStatus]   = useState("confirmed");
  const [eta,      setEta]      = useState(null);
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);
  const [showMap,  setShowMap]  = useState(false); // 👈 NEW: map modal toggle
  const pollRef = useRef(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    fetchOrderDetails();
    pollRef.current = setInterval(fetchOrderDetails, 5000);
    return () => clearInterval(pollRef.current);
  }, [orderId]); // eslint-disable-line

  const fetchOrderDetails = async () => {
    try {
      const res  = await fetch(`${API_BASE}/orders/${orderId}/tracking`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setOrder(data.order);
      setStatus(data.status);
      setEta(data.eta_minutes);
      setEvents(data.events || []);

      setCook(data.cook || null);
      setRider(data.rider || null);

      if (data.status === "delivered") clearInterval(pollRef.current);
    } catch {
      // Gracefully handle – show last known state
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const stageIdx = stageIndex(status);
  const riderAssigned = stageIdx >= 3;

  if (loading) return <LoadingScreen />;

  return (
    <>
      <style>{STYLES}</style>

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}

      {/* Map Modal */}
      {showMap && (
        <DeliveryMapModal
          onClose={() => setShowMap(false)}
          order={order}
          rider={rider}
        />
      )}

      {/* NAV */}
      <div className="dt-nav">
        <Link to="/" className="dt-logo">Fresh<span>Bite</span></Link>
        <button className="dt-back" onClick={() => navigate("/profile")}>
          ← My Orders
        </button>
      </div>

      {/* HERO */}
      <div className={`dt-hero ${status === "delivered" ? "dt-hero-green" : ""}`}>
        <div className="dt-hero-inner">
          {status === "delivered" ? (
            <>
              <div className="dt-success-icon">✓</div>
              <h1>Delivered! 🎉</h1>
              <p>Hope you enjoy your meal.</p>
            </>
          ) : (
            <>
              <div className="dt-eta-big">
                {eta != null ? `${eta} min` : "–"}
              </div>
              <p className="dt-eta-label">Estimated delivery time</p>

              {/* 👇 NEW: Live Map button — only visible once rider is assigned */}
              {riderAssigned && (
                <button
                  className="dt-map-btn"
                  onClick={() => setShowMap(true)}
                >
                  🗺️ View Live Map
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="dt-body">

        {/* PROGRESS BAR */}
        <div className="dt-progress-card">
          <div className="dt-progress-track">
            {STAGES.map((s, i) => (
              <React.Fragment key={s.key}>
                <div className="dt-step">
                  <div
                    className={`dt-dot ${
                      i < stageIdx  ? "dt-dot-done"    :
                      i === stageIdx ? "dt-dot-active"  : "dt-dot-pending"
                    }`}
                  >
                    {i < stageIdx ? "✓" : s.icon}
                  </div>
                  <span
                    className={`dt-step-label ${
                      i <= stageIdx ? "dt-step-label-active" : ""
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <div className={`dt-connector ${i < stageIdx ? "dt-connector-done" : ""}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* COOK CARD */}
        <PersonCard
          title="Home Cook"
          emoji="👩‍🍳"
          person={cook}
          placeholderName="Finding nearest cook…"
          placeholderSub="Matching you with a home cook nearby"
          statusText={
            !cook          ? "Searching…"   :
            stageIdx >= 3  ? "Handed off ✓" :
            stageIdx === 2 ? "Cooking 🍳"   : "Accepted ✓"
          }
          showCall={!!cook}
          onCall={() => showToast("Calling cook…")}
          accent="blue"
        />

        {/* RIDER CARD — clicking opens map */}
        <PersonCard
          title="Delivery Partner"
          emoji="🏍️"
          person={rider}
          placeholderName="Assigning delivery partner…"
          placeholderSub="Rider will be assigned once food is ready"
          statusText={
            !rider                     ? "Pending"         :
            status === "delivered"     ? "Delivered ✓"     : "Delivering 🏍️"
          }
          showCall={!!rider}
          onCall={() => showToast("Calling rider…")}
          accent="amber"
          dimmed={!rider}
          onCardClick={riderAssigned ? () => setShowMap(true) : undefined}
          showMapHint={riderAssigned}
        />

        {/* ORDER ITEMS with safe price display */}
        {order?.items?.length > 0 && (
          <div className="dt-card">
            <div className="dt-card-title">Your Order</div>
            {order.items.map((item, i) => (
              <div key={i} className="dt-order-item">
                <span className="dt-order-item-name">
                  {item.name || item.item_name || "Item"}
                  <span className="dt-order-item-qty">
                    × {item.quantity || item.qty || 1}
                  </span>
                </span>
                {/* ✅ Safe price — never shows NaN */}
                <span className="dt-order-item-price">
                  ₹{formatPrice(
                    item.price || item.unit_price || item.amount,
                    item.quantity || item.qty || 1
                  )}
                </span>
              </div>
            ))}
            <div className="dt-order-total">
              <span>Total</span>
              <span>
                ₹{
                  order.items.reduce((sum, item) => {
                    const price = parseFloat(item.price || item.unit_price || item.amount) || 0;
                    const qty   = parseInt(item.quantity || item.qty || 1) || 1;
                    return sum + price * qty;
                  }, 0).toFixed(2)
                }
              </span>
            </div>
          </div>
        )}

        {/* LIVE TIMELINE */}
        <div className="dt-card">
          <div className="dt-card-title">Live updates</div>
          {events.length === 0 ? (
            <p className="dt-muted">Waiting for updates…</p>
          ) : (
            <div className="dt-timeline">
              {[...events].reverse().map((ev, i) => (
                <div className="dt-tl-item" key={i}>
                  <div className={`dt-tl-dot ${i === 0 ? "dt-tl-dot-now" : "dt-tl-dot-done"}`}>
                    {i === 0 ? "●" : "✓"}
                  </div>
                  <div>
                    <div className="dt-tl-text">{ev.message}</div>
                    <div className="dt-tl-time">{ev.time_label || ev.created_at}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DELIVERY ADDRESS */}
        {order?.delivery_address && (
          <div className="dt-card">
            <div className="dt-card-title">Delivering to</div>
            <p className="dt-address">📍 {order.delivery_address}</p>
            {order.custom_note && (
              <div className="dt-note">📝 {order.custom_note}</div>
            )}
          </div>
        )}

        {/* BOTTOM ACTIONS */}
        {status === "delivered" ? (
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button className="dt-btn-primary" onClick={() => navigate("/menu")}>
              Order Again
            </button>
            <button className="dt-btn-ghost" onClick={() => navigate("/profile")}>
              View Receipt
            </button>
          </div>
        ) : (
          <button className="dt-btn-ghost" style={{ marginTop: 8 }}>
            🚫 Cancel Order
          </button>
        )}

      </div>
    </>
  );
}

// ─── Person card ───────────────────────────────────────────────────────────
function PersonCard({
  title, emoji, person, placeholderName, placeholderSub,
  statusText, showCall, onCall, accent, dimmed,
  onCardClick, showMapHint,
}) {
  const initials = person?.name
    ? person.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div
      className={`dt-card ${dimmed ? "dt-card-dim" : ""} ${onCardClick ? "dt-card-clickable" : ""}`}
      onClick={onCardClick}
    >
      <div className="dt-card-title">{title}</div>
      <div className="dt-person-row">
        <div className={`dt-avatar dt-avatar-${accent}`}>
          {person ? initials : emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div className="dt-person-name">
            {person ? person.name : placeholderName}
          </div>
          <div className="dt-person-sub">
            {person
              ? `${person.area || "Nearby"} · ${person.distance_km?.toFixed(1) ?? "–"} km away`
              : placeholderSub}
          </div>
          {person?.rating && (
            <div className="dt-stars">
              {"★".repeat(Math.round(person.rating))}
              {"☆".repeat(5 - Math.round(person.rating))}
              <span className="dt-muted" style={{ marginLeft: 4 }}>
                ({person.total_orders ?? "–"} orders)
              </span>
            </div>
          )}
          {showMapHint && (
            <div className="dt-map-hint">🗺️ Tap to view live map</div>
          )}
        </div>
        <div style={{ textAlign: "right", marginLeft: 8 }}>
          <div className="dt-status-pill">{statusText}</div>
        </div>
        {showCall && (
          <button
            className="dt-call-btn"
            onClick={(e) => { e.stopPropagation(); onCall(); }}
          >
            📞
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <>
      <style>{STYLES}</style>
      <div className="dt-loading">
        <div className="dt-spinner" />
        <p>Loading your order…</p>
      </div>
    </>
  );
}

// ─── Custom Google Maps style (clean/minimal) ──────────────────────────────
const MAPS_STYLE = [
  { featureType: "poi",            elementType: "labels",      stylers: [{ visibility: "off" }] },
  { featureType: "transit",        elementType: "labels",      stylers: [{ visibility: "off" }] },
  { featureType: "road",           elementType: "geometry",    stylers: [{ color: "#f5f5f5" }] },
  { featureType: "road.arterial",  elementType: "geometry",    stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway",   elementType: "geometry",    stylers: [{ color: "#dadada" }] },
  { featureType: "water",          elementType: "geometry",    stylers: [{ color: "#c9e8f9" }] },
  { featureType: "landscape",      elementType: "geometry",    stylers: [{ color: "#f9f9f9" }] },
];

// ─── Styles ────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
  body { background: #fef6f5; font-family: 'Sora', sans-serif; margin: 0; }

  /* NAV */
  .dt-nav {
    position: fixed; top: 0; left: 0; right: 0; height: 64px;
    display: flex; justify-content: space-between; align-items: center;
    padding: 0 24px;
    background: rgba(255,255,255,0.95); backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(232,83,74,0.1); z-index: 1000;
    box-shadow: 0 2px 20px rgba(0,0,0,0.06);
  }
  .dt-logo { font-weight: 800; font-size: 22px; color: #1a1a1a; text-decoration: none; }
  .dt-logo span { color: #e8534a; }
  .dt-back {
    border: none; background: none; font-family: 'Sora', sans-serif;
    font-size: 14px; font-weight: 600; color: #e8534a; cursor: pointer;
  }

  /* HERO */
  .dt-hero {
    padding: 90px 20px 60px;
    background: linear-gradient(135deg, #e8534a 0%, #f97316 100%);
    text-align: center; color: white;
  }
  .dt-hero-green { background: linear-gradient(135deg, #4caf50, #2e7d32); }
  .dt-hero-inner { position: relative; }
  .dt-eta-big { font-size: 52px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
  .dt-eta-label { color: rgba(255,255,255,0.85); font-size: 15px; margin: 0 0 16px; }
  .dt-success-icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: rgba(255,255,255,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 32px; margin: 0 auto 14px;
  }
  .dt-hero h1 { font-size: 28px; font-weight: 800; margin: 0 0 6px; }
  .dt-hero p  { margin: 0; color: rgba(255,255,255,0.85); }

  /* Live Map button in hero */
  .dt-map-btn {
    margin-top: 14px;
    padding: 10px 24px;
    border: 2px solid rgba(255,255,255,0.8);
    border-radius: 30px;
    background: rgba(255,255,255,0.15);
    color: white;
    font-family: 'Sora', sans-serif;
    font-weight: 700; font-size: 14px;
    cursor: pointer;
    backdrop-filter: blur(6px);
    transition: background 0.2s;
  }
  .dt-map-btn:hover { background: rgba(255,255,255,0.28); }

  /* BODY */
  .dt-body { max-width: 520px; margin: -28px auto 60px; padding: 0 16px; }

  /* PROGRESS */
  .dt-progress-card {
    background: white; border-radius: 18px; padding: 20px 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 12px;
  }
  .dt-progress-track { display: flex; align-items: center; }
  .dt-step { display: flex; flex-direction: column; align-items: center; flex: 0 0 auto; }
  .dt-dot {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; transition: all 0.3s;
  }
  .dt-dot-done    { background: #dcfce7; color: #16a34a; }
  .dt-dot-active  { background: #fef9c3; color: #ca8a04; }
  .dt-dot-pending { background: #f5f5f5; color: #aaa; }
  .dt-connector { flex: 1; height: 2px; background: #f0f0f0; margin: 0 2px 18px; transition: background 0.3s; }
  .dt-connector-done { background: #86efac; }
  .dt-step-label { font-size: 10px; color: #ccc; margin-top: 5px; text-align: center; max-width: 54px; }
  .dt-step-label-active { color: #555; font-weight: 600; }

  /* CARDS */
  .dt-card {
    background: white; border-radius: 16px; padding: 16px 18px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 12px;
    transition: opacity 0.3s;
  }
  .dt-card-dim { opacity: 0.45; }
  .dt-card-clickable { cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; }
  .dt-card-clickable:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }
  .dt-card-title { font-weight: 700; font-size: 13px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }

  /* PERSON */
  .dt-person-row { display: flex; align-items: center; gap: 12px; }
  .dt-avatar {
    width: 46px; height: 46px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700; flex-shrink: 0;
  }
  .dt-avatar-blue   { background: #dbeafe; color: #1d4ed8; }
  .dt-avatar-amber  { background: #fef3c7; color: #b45309; }
  .dt-person-name { font-weight: 700; font-size: 14px; color: #1a1a1a; }
  .dt-person-sub  { font-size: 12px; color: #888; margin-top: 2px; }
  .dt-stars { color: #f59e0b; font-size: 12px; margin-top: 3px; }
  .dt-map-hint { font-size: 11px; color: #e8534a; font-weight: 600; margin-top: 4px; }
  .dt-status-pill {
    font-size: 11px; background: #f0fdf4; color: #16a34a;
    border: 1px solid #bbf7d0; padding: 3px 10px; border-radius: 20px;
    font-weight: 600; white-space: nowrap;
  }
  .dt-call-btn {
    width: 36px; height: 36px; border-radius: 50%;
    border: 1px solid #e5e7eb; background: #f9fafb;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 14px; flex-shrink: 0;
  }

  /* ORDER ITEMS */
  .dt-order-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px;
  }
  .dt-order-item:last-of-type { border-bottom: none; }
  .dt-order-item-name { color: #1a1a1a; }
  .dt-order-item-qty  { color: #aaa; margin-left: 6px; font-size: 12px; }
  .dt-order-item-price { font-weight: 700; color: #1a1a1a; }
  .dt-order-total {
    display: flex; justify-content: space-between;
    padding-top: 10px; margin-top: 4px;
    border-top: 2px solid #f0f0f0;
    font-weight: 700; font-size: 15px; color: #1a1a1a;
  }

  /* TIMELINE */
  .dt-timeline { display: flex; flex-direction: column; gap: 0; }
  .dt-tl-item  { display: flex; gap: 12px; align-items: flex-start; padding-bottom: 14px; position: relative; }
  .dt-tl-item:last-child { padding-bottom: 0; }
  .dt-tl-item:not(:last-child)::after {
    content: ''; position: absolute; left: 11px; top: 26px; width: 1px; bottom: 0;
    background: #f0f0f0;
  }
  .dt-tl-dot {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; flex-shrink: 0;
  }
  .dt-tl-dot-done { background: #dcfce7; color: #16a34a; }
  .dt-tl-dot-now  { background: #fef9c3; color: #ca8a04; }
  .dt-tl-text { font-size: 13px; color: #1a1a1a; line-height: 1.4; padding-top: 3px; }
  .dt-tl-time { font-size: 11px; color: #bbb; margin-top: 2px; }

  /* MISC */
  .dt-address { font-size: 14px; color: #555; margin: 0; }
  .dt-note    { margin-top: 10px; padding: 10px 12px; background: #fffbf0; border: 1px solid #fde68a; border-radius: 10px; font-size: 13px; color: #92400e; }
  .dt-muted   { font-size: 13px; color: #aaa; }

  /* BUTTONS */
  .dt-btn-primary {
    flex: 1; padding: 13px; border: none; border-radius: 30px;
    background: linear-gradient(135deg, #e8534a, #f97316);
    color: white; font-weight: 700; font-size: 14px; cursor: pointer;
    font-family: 'Sora', sans-serif;
    box-shadow: 0 4px 16px rgba(232,83,74,0.3);
  }
  .dt-btn-ghost {
    width: 100%; padding: 12px; border: 2px solid #e8534a;
    border-radius: 30px; background: transparent; color: #e8534a;
    font-weight: 700; font-size: 14px; cursor: pointer;
    font-family: 'Sora', sans-serif;
  }

  /* LOADING */
  .dt-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; color: #aaa; }
  .dt-spinner {
    width: 40px; height: 40px; border: 3px solid #f0f0f0;
    border-top-color: #e8534a; border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* TOAST */
  .toast {
    position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
    padding: 12px 24px; border-radius: 30px; font-weight: 600; font-size: 14px;
    z-index: 9999; box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    animation: slideUp 0.3s ease; white-space: nowrap;
  }
  .toast-success { background: #4caf50; color: white; }
  .toast-error   { background: #e8534a; color: white; }
  @keyframes slideUp {
    from { opacity: 0; transform: translate(-50%, 20px); }
    to   { opacity: 1; transform: translate(-50%, 0); }
  }

  /* MAP MODAL */
  .map-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 2000; padding: 16px;
  }
  .map-modal {
    background: white; border-radius: 20px;
    width: 100%; max-width: 580px;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(0,0,0,0.25);
    animation: modalIn 0.25s ease;
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .map-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 20px; border-bottom: 1px solid #f0f0f0;
  }
  .map-title  { margin: 0; font-size: 17px; font-weight: 800; color: #1a1a1a; }
  .map-eta    { margin: 4px 0 0; font-size: 13px; color: #666; }
  .map-rider-name { color: #e8534a; }
  .map-close  {
    background: #f5f5f5; border: none; border-radius: 50%;
    width: 32px; height: 32px; cursor: pointer;
    font-size: 14px; color: #666; display: flex; align-items: center; justify-content: center;
  }
  .map-container { width: 100%; height: 360px; }
  .map-loading {
    height: 100%; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px; color: #aaa;
  }
  .map-legend {
    display: flex; align-items: center; justify-content: center;
    gap: 10px; padding: 14px; background: #fef6f5;
    font-size: 13px; color: #555;
  }
  .map-legend-line { color: #e8534a; letter-spacing: 1px; }
`;