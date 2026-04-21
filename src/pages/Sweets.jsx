import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToCart as saveToGlobalCart, removeOneFromCart } from "../utils/cartUtils";

const sweets = [
  {
    name: "Gulab Jamun",
    desc: "Soft milk solid dumplings soaked in rose sugar syrup",
    price: 100,
    tag: "⭐ All-time Classic",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80"
  },
  {
    name: "Kaju Katli",
    desc: "Premium cashew fudge with silver vark topping",
    price: 200,
    tag: "👑 Premium",
    image: "https://images.unsplash.com/photo-1632983289045-45c9c5b2bd5b?w=400&q=80"
  },
  {
    name: "Rasgulla",
    desc: "Spongy cottage cheese balls in light sugar syrup",
    price: 120,
    tag: "🤍 Bengali Special",
    image: "https://images.unsplash.com/photo-1666343813948-d6711ef2d9ec?w=400&q=80"
  },
  {
    name: "Laddu",
    desc: "Golden besan laddus with cardamom & dry fruits",
    price: 90,
    tag: "🪔 Festive Favourite",
    image: "https://images.unsplash.com/photo-1606471191009-63994c53433b?w=400&q=80"
  },
  {
    name: "Jalebi",
    desc: "Crispy spiral sweets soaked in warm saffron syrup",
    price: 80,
    tag: "🌀 Street Classic",
    image: "https://images.unsplash.com/photo-1619873673672-f80e6e7e5d88?w=400&q=80"
  },
  {
    name: "Halwa",
    desc: "Silky semolina halwa with ghee, raisins & cashews",
    price: 110,
    tag: "🧡 Comfort Sweet",
    image: "https://images.unsplash.com/photo-1595478281015-2b9dbae8ede4?w=400&q=80"
  },
  {
    name: "Barfi",
    desc: "Rich milk fudge with pistachio & rose petal garnish",
    price: 150,
    tag: "🌹 Signature",
    image: "https://images.unsplash.com/photo-1643052505693-4ebc9a7d7ef8?w=400&q=80"
  },
  {
    name: "Kheer",
    desc: "Creamy rice pudding with saffron, almonds & cardamom",
    price: 130,
    tag: "🍚 Royal Dessert",
    image: "https://images.unsplash.com/photo-1659699967648-7e2ed9826843?w=400&q=80"
  },
  {
    name: "Brownie",
    desc: "Fudgy dark chocolate brownie with walnut chunks",
    price: 160,
    tag: "🍫 Bestseller",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80"
  },
  {
    name: "Gajar Halwa",
    desc: "Winter special carrot halwa with khoya & dry fruits",
    price: 140,
    tag: "🥕 Winter Special",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80"
  },
  {
    name: "Coconut Laddoo",
    desc: "Fresh coconut laddoos rolled in desiccated coconut",
    price: 95,
    tag: "🥥 Light & Sweet",
    image: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400&q=80"
  },
  {
    name: "Ice Cream Sundae",
    desc: "Three scoops with hot fudge, nuts & a cherry on top",
    price: 180,
    tag: "🍨 Crowd Pleaser",
    image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80"
  },
];

function Sweets() {
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

  const accent = "#e91e8c";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff0f8", fontFamily: "'Georgia', serif" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #e91e8c, #f48fb1)",
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

        <h1 style={{ color: "white", fontSize: "38px", margin: "0 0 8px" }}>🍬 Sweets</h1>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", margin: 0 }}>
          Traditional Indian sweets & modern desserts
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
          {sweets.map((item, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: "white",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: hoveredCard === i
                  ? "0 14px 35px rgba(233,30,140,0.2)"
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
                  backgroundColor: "#4caf50",
                  color: "white", fontSize: "10px",
                  padding: "3px 8px", borderRadius: "10px",
                  fontFamily: "sans-serif", fontWeight: "bold"
                }}>🟢 VEG</span>
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
                        backgroundColor: addedItem === item.name ? "#f48fb1" : accent,
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
                Your cart is empty 🍬
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
                  backgroundColor: "#fff0f8", borderRadius: "12px"
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

export default Sweets;