import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToCart as saveToGlobalCart, removeOneFromCart } from "../utils/cartUtils";

const homeMeals = [
  {
    name: "Chapati Curry",
    desc: "Soft whole wheat chapatis with rich mixed vegetable curry",
    price: 120,
    tag: "🏠 Home Classic",
    veg: true,
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80"
  },
  {
    name: "Veg Pulao",
    desc: "Fragrant basmati rice cooked with seasonal vegetables & spices",
    price: 140,
    tag: "🌿 Light & Healthy",
    veg: true,
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80"
  },
  {
    name: "Lemon Rice",
    desc: "Tangy South Indian lemon rice with peanuts & curry leaves",
    price: 90,
    tag: "🍋 South Special",
    veg: true,
    image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80"
  },
  {
    name: "Dal Tadka",
    desc: "Yellow lentils tempered with cumin, garlic & ghee",
    price: 110,
    tag: "💛 Comfort Food",
    veg: true,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80"
  },
  {
    name: "Hyderabadi Biryani",
    desc: "Slow-cooked aromatic basmati with tender chicken & saffron",
    price: 280,
    tag: "🔥 Bestseller",
    veg: false,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80"
  },
  {
    name: "Paneer Butter Masala",
    desc: "Creamy tomato gravy with soft paneer cubes & butter",
    price: 220,
    tag: "⭐ Most Loved",
    veg: true,
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80"
  },
  {
    name: "Curd Rice",
    desc: "Creamy curd rice tempered with mustard, curry leaves & pomegranate",
    price: 100,
    tag: "🥣 Cooling & Light",
    veg: true,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80"
  },
  {
    name: "Chicken Curry",
    desc: "Spicy homestyle chicken curry with a rich masala gravy",
    price: 260,
    tag: "🍗 Non-Veg Special",
    veg: false,
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80"
  },
  {
    name: "Sambar Rice",
    desc: "Piping hot rice with tangy tamarind sambar & papad",
    price: 110,
    tag: "🏡 Homely Taste",
    veg: true,
    image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=80"
  },
  {
    name: "Egg Curry",
    desc: "Boiled eggs in spicy onion-tomato masala gravy",
    price: 180,
    tag: "🥚 Protein Packed",
    veg: false,
    image: "https://images.unsplash.com/photo-1645177628172-a94c1f96debb?w=400&q=80"
  },
  {
    name: "Rajma Chawal",
    desc: "Hearty kidney bean curry served with steamed basmati rice",
    price: 150,
    tag: "❤️ North Indian Soul",
    veg: true,
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80"
  },
  {
    name: "Aloo Paratha",
    desc: "Stuffed potato flatbread served with curd & pickle",
    price: 130,
    tag: "🥔 Punjabi Favourite",
    veg: true,
    image: "https://images.unsplash.com/photo-1604152135912-04a022e23696?w=400&q=80"
  },
];

function HomeMeals() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [addedItem, setAddedItem] = useState(null);

  const addToCart = (item) => {
    setCart(prev => ({
      ...prev,
      [item.name]: { ...item, qty: (prev[item.name]?.qty || 0) + 1 }
    }));
    // ← ADD THIS: also save to shared localStorage cart
    saveToGlobalCart({
      name: item.name,
      price: item.price,
      category: "Home Meals",
      image: item.image
    });
    setAddedItem(item.name);
    setTimeout(() => setAddedItem(null), 1000);
  };

  const removeFromCart = (name) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[name].qty <= 1) delete updated[name];
      else updated[name].qty -= 1;
      return updated;
    });
  };

  const cartItems = Object.values(cart);
  const totalItems = cartItems.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  const accent = "#ff9800";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff8f0", fontFamily: "'Georgia', serif" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #ff9800, #ffb74d)",
        padding: "40px 30px 30px",
        textAlign: "center",
        position: "relative"
      }}>
        <button onClick={() => navigate("/menu")} style={{
          position: "absolute", top: "20px", left: "20px",
          backgroundColor: "rgba(255,255,255,0.2)",
          color: "white", border: "none",
          padding: "8px 16px", borderRadius: "20px",
          cursor: "pointer", fontSize: "13px"
        }}>← Menu</button>

        <h1 style={{ color: "white", fontSize: "38px", margin: "0 0 8px" }}>🍱 Home Meals</h1>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", margin: 0 }}>
          Comfort food made with love — just like home
        </p>

        {totalItems > 0 && (
          <button onClick={() => setShowCart(true)} style={{
            position: "absolute", top: "20px", right: "20px",
            backgroundColor: "white", color: accent,
            border: "none", padding: "8px 18px",
            borderRadius: "20px", cursor: "pointer",
            fontWeight: "bold", fontSize: "14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}>
            🛒 Cart ({totalItems})
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "24px"
        }}>
          {homeMeals.map((item, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: "white",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: hoveredCard === i
                  ? "0 14px 35px rgba(255,152,0,0.2)"
                  : "0 4px 14px rgba(0,0,0,0.07)",
                transform: hoveredCard === i ? "translateY(-6px)" : "translateY(0)",
                transition: "all 0.3s ease"
              }}
            >
              {/* Image */}
              <div style={{
                height: "170px",
                backgroundImage: `url(${item.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "relative"
              }}>
                <span style={{
                  position: "absolute", top: "10px", left: "10px",
                  backgroundColor: "rgba(0,0,0,0.55)",
                  color: "white", fontSize: "11px",
                  padding: "4px 10px", borderRadius: "20px",
                  fontFamily: "sans-serif"
                }}>{item.tag}</span>

                <span style={{
                  position: "absolute", top: "10px", right: "10px",
                  backgroundColor: item.veg ? "#4caf50" : "#f44336",
                  color: "white", fontSize: "10px",
                  padding: "3px 8px", borderRadius: "10px",
                  fontFamily: "sans-serif", fontWeight: "bold"
                }}>{item.veg ? "🟢 VEG" : "🔴 NON-VEG"}</span>
              </div>

              {/* Info */}
              <div style={{ padding: "16px" }}>
                <div style={{ fontWeight: "bold", fontSize: "16px", color: "#222" }}>{item.name}</div>
                <div style={{ fontSize: "12px", color: "#999", margin: "5px 0 12px", fontFamily: "sans-serif" }}>
                  {item.desc}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "18px", fontWeight: "bold", color: accent, fontFamily: "sans-serif" }}>
                    ₹{item.price}
                  </span>

                  {cart[item.name] ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button onClick={() => removeFromCart(item.name)} style={qtyBtn(accent)}>−</button>
                      <span style={{ fontWeight: "bold", fontFamily: "sans-serif", color: "#333" }}>
                        {cart[item.name].qty}
                      </span>
                      <button onClick={() => addToCart(item)} style={qtyBtn(accent)}>+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      style={{
                        backgroundColor: addedItem === item.name ? "#ffb74d" : accent,
                        color: "white", border: "none",
                        padding: "8px 16px", borderRadius: "20px",
                        fontSize: "13px", cursor: "pointer",
                        fontFamily: "sans-serif", fontWeight: "bold",
                        transition: "background 0.3s"
                      }}
                    >
                      {addedItem === item.name ? "✓ Added!" : "+ Add"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cart Sidebar ── */}
      {showCart && (
        <div style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 1000, display: "flex", justifyContent: "flex-end"
        }}>
          <div style={{
            backgroundColor: "white", width: "320px",
            height: "100%", padding: "25px",
            overflowY: "auto",
            boxShadow: "-5px 0 20px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: accent }}>🛒 Your Cart</h2>
              <button onClick={() => setShowCart(false)} style={{
                background: "none", border: "none",
                fontSize: "22px", cursor: "pointer", color: "#999"
              }}>✕</button>
            </div>

            {cartItems.length === 0 ? (
              <p style={{ color: "#aaa", textAlign: "center", marginTop: "50px", fontFamily: "sans-serif" }}>
                Your cart is empty 🍱
              </p>
            ) : (
              <>
                {cartItems.map((item, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "12px 0",
                    borderBottom: "1px solid #f0f0f0"
                  }}>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "14px", color: "#222" }}>{item.name}</div>
                      <div style={{ fontSize: "12px", color: "#999", fontFamily: "sans-serif" }}>
                        ₹{item.price} × {item.qty}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button onClick={() => removeFromCart(item.name)} style={qtyBtn(accent)}>−</button>
                      <span style={{ fontFamily: "sans-serif", fontWeight: "bold" }}>{item.qty}</span>
                      <button onClick={() => addToCart(item)} style={qtyBtn(accent)}>+</button>
                    </div>
                  </div>
                ))}

                <div style={{
                  marginTop: "20px", padding: "16px",
                  backgroundColor: "#fff8f0", borderRadius: "12px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "sans-serif" }}>
                    <span style={{ color: "#555" }}>Total Items:</span>
                    <span style={{ fontWeight: "bold" }}>{totalItems}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "sans-serif", marginTop: "8px" }}>
                    <span style={{ color: "#555" }}>Total Price:</span>
                    <span style={{ fontWeight: "bold", color: accent, fontSize: "18px" }}>₹{totalPrice}</span>
                  </div>
                </div>

                <button
                      onClick={() => navigate("/cart")}   // ← ADD THIS
                      style={{
                      width: "100%", marginTop: "20px",
                      padding: "14px", backgroundColor: accent,
                      color: "white", border: "none",
                      borderRadius: "12px", fontSize: "16px",
                      cursor: "pointer", fontWeight: "bold",
                      fontFamily: "sans-serif"
            }}>
                      View Full Cart 🛒
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const qtyBtn = (color) => ({
  backgroundColor: color,
  color: "white", border: "none",
  width: "26px", height: "26px",
  borderRadius: "50%", cursor: "pointer",
  fontSize: "16px", fontWeight: "bold",
  display: "flex", alignItems: "center", justifyContent: "center"
});

export default HomeMeals;