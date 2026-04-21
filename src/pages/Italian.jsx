import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToCart as saveToGlobalCart, removeOneFromCart } from "../utils/cartUtils";
const italianItems = [
  {
    name: "Margherita Pizza",
    desc: "Classic tomato base with fresh mozzarella & basil leaves",
    price: 250,
    tag: "🍕 All-time Classic",
    veg: true,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80"
  },
  {
    name: "Pepperoni Pizza",
    desc: "Loaded with spicy pepperoni slices & mozzarella",
    price: 320,
    tag: "🔥 Bestseller",
    veg: false,
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80"
  },
  {
    name: "Pasta Arrabiata",
    desc: "Penne in spicy tomato sauce with garlic & chilli flakes",
    price: 200,
    tag: "🌶️ Spicy Pick",
    veg: true,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80"
  },
  {
    name: "Pasta Alfredo",
    desc: "Creamy white sauce fettuccine with parmesan & herbs",
    price: 220,
    tag: "🧀 Creamy Classic",
    veg: true,
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023882d?w=400&q=80"
  },
  {
    name: "Garlic Bread",
    desc: "Toasted baguette with herb butter & roasted garlic",
    price: 150,
    tag: "🥖 Side Favourite",
    veg: true,
    image: "https://images.unsplash.com/photo-1619531040576-f9416740661e?w=400&q=80"
  },
  {
    name: "Lasagne",
    desc: "Layered pasta with rich bolognese & béchamel sauce",
    price: 350,
    tag: "👨‍🍳 Chef's Special",
    veg: false,
    image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&q=80"
  },
  {
    name: "Risotto",
    desc: "Creamy arborio rice with mushrooms, wine & parmesan",
    price: 280,
    tag: "🍄 Gourmet",
    veg: true,
    image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80"
  },
  {
    name: "Bruschetta",
    desc: "Toasted bread with tomato, basil & extra virgin olive oil",
    price: 160,
    tag: "🍅 Starter",
    veg: true,
    image: "https://images.unsplash.com/photo-1506280754576-f6fa8a873550?w=400&q=80"
  },
  {
    name: "Chicken Parmigiana",
    desc: "Breaded chicken breast with marinara & melted cheese",
    price: 380,
    tag: "💪 Protein Rich",
    veg: false,
    image: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400&q=80"
  },
  {
    name: "Tiramisu",
    desc: "Classic Italian dessert with espresso-soaked ladyfingers",
    price: 200,
    tag: "☕ Must Try",
    veg: true,
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80"
  },
  {
    name: "Penne Rosé",
    desc: "Penne in a rich blend of tomato & cream sauce",
    price: 230,
    tag: "🌹 Signature",
    veg: true,
    image: "https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=400&q=80"
  },
  {
    name: "Focaccia Bread",
    desc: "Fluffy Italian flatbread with olives, rosemary & sea salt",
    price: 170,
    tag: "🫒 Artisan",
    veg: true,
    image: "https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?w=400&q=80"
  },
];

function Italian() {
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

  const accent = "#f44336";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff8f0", fontFamily: "'Georgia', serif" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #f44336, #ff8a65)",
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

        <h1 style={{ color: "white", fontSize: "38px", margin: "0 0 8px" }}>🍕 Italian Food</h1>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", margin: 0 }}>
          Authentic Italian flavours — pizza, pasta & more
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
          {italianItems.map((item, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: "white",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: hoveredCard === i
                  ? "0 14px 35px rgba(244,67,54,0.2)"
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
                        backgroundColor: addedItem === item.name ? "#ff8a65" : accent,
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
                Your cart is empty 🍕
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

export default Italian;