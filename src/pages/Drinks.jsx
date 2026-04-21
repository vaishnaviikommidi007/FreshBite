import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToCart as saveToGlobalCart, removeOneFromCart } from "../utils/cartUtils";

const drinks = [
  {
    name: "Mango Juice",
    desc: "Fresh Alphonso mangoes blended to perfection",
    price: 80,
    tag: "☀️ Summer Special",
    veg: true,
    image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80"
  },
  {
    name: "Cold Coffee",
    desc: "Chilled espresso with creamy milk & ice",
    price: 120,
    tag: "☕ Bestseller",
    veg: true,
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80"
  },
  {
    name: "Lassi",
    desc: "Thick Punjabi curd lassi, sweet & refreshing",
    price: 70,
    tag: "🥛 Classic",
    veg: true,
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80"
  },
  {
    name: "Lemon Juice",
    desc: "Fresh squeezed lemon with mint & black salt",
    price: 50,
    tag: "🍋 Refreshing",
    veg: true,
    image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80"
  },
  {
    name: "Green Smoothie",
    desc: "Spinach, banana, apple & honey blend",
    price: 140,
    tag: "🥗 Healthy",
    veg: true,
    image: "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&q=80"
  },
  {
    name: "Strawberry Shake",
    desc: "Fresh strawberries blended with chilled milk",
    price: 150,
    tag: "🍓 Fan Favourite",
    veg: true,
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&q=80"
  },
  {
    name: "Masala Chai",
    desc: "Spiced Indian tea with ginger & cardamom",
    price: 40,
    tag: "🫖 All-time Classic",
    veg: true,
    image: "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=400&q=80"
  },
  {
    name: "Watermelon Cooler",
    desc: "Fresh watermelon juice with a hint of mint",
    price: 90,
    tag: "🍉 Summer Hit",
    veg: true,
    image: "https://images.unsplash.com/photo-1582617038955-e3b5e5e8e7dc?w=400&q=80"
  },
  {
    name: "Coconut Water",
    desc: "Pure tender coconut water, naturally sweet",
    price: 60,
    tag: "🥥 Natural",
    veg: true,
    image: "https://images.unsplash.com/photo-1609357605129-4f82e34d44e0?w=400&q=80"
  },
  {
    name: "Oreo Milkshake",
    desc: "Crushed Oreos blended with vanilla ice cream",
    price: 180,
    tag: "🍪 Indulgent",
    veg: true,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80"
  },
  {
    name: "Blue Lagoon",
    desc: "Blue curacao, lemon & soda — a visual treat",
    price: 130,
    tag: "💙 Signature",
    veg: true,
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80"
  },
  {
    name: "Rose Sharbat",
    desc: "Chilled rose syrup with basil seeds & milk",
    price: 75,
    tag: "🌹 Desi Favourite",
    veg: true,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80"
  },
];

function Drinks() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [addedItem, setAddedItem] = useState(null);
  const [quantities, setQuantities] = useState({});

  const addToCart = (item) => {
    saveToGlobalCart({
      name: item.name,
      price: item.price,
      category: "Drinks",
      image: item.image
    });
    setQuantities(prev => ({
      ...prev,
      [item.name]: (prev[item.name] || 0) + 1
    }));
    setAddedItem(item.name);
    setTimeout(() => setAddedItem(null), 1000);
  };

  const removeFromCart = (item) => {
    removeOneFromCart(item.name);
    setQuantities(prev => {
      const updated = { ...prev };
      if ((updated[item.name] || 0) <= 1) delete updated[item.name];
      else updated[item.name] -= 1;
      return updated;
    });
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f8ff", fontFamily: "'Georgia', serif" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #2196f3, #21cbf3)",
        padding: "40px 30px 30px",
        textAlign: "center",
        position: "relative"
      }}>
        <button
          onClick={() => navigate("/menu")}
          style={{
            position: "absolute", top: "20px", left: "20px",
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "white", border: "none",
            padding: "8px 16px", borderRadius: "20px",
            cursor: "pointer", fontSize: "13px"
          }}
        >← Menu</button>

        <h1 style={{ color: "white", fontSize: "38px", margin: "0 0 8px" }}>🍹 Drinks</h1>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", margin: 0 }}>
          Chilled, fresh & delicious — sip your mood
        </p>

        <button
          onClick={() => navigate("/cart")}
          style={{
            position: "absolute", top: "20px", right: "20px",
            backgroundColor: "white", color: "#2196f3",
            border: "none", padding: "8px 18px",
            borderRadius: "20px", cursor: "pointer",
            fontWeight: "bold", fontSize: "14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}
        >
          🛒 Cart
        </button>
      </div>

      {/* ── Drinks Grid ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "24px"
        }}>
          {drinks.map((drink, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: "white",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: hoveredCard === i
                  ? "0 14px 35px rgba(33,150,243,0.2)"
                  : "0 4px 14px rgba(0,0,0,0.07)",
                transform: hoveredCard === i ? "translateY(-6px)" : "translateY(0)",
                transition: "all 0.3s ease"
              }}
            >
              {/* Image */}
              <div style={{
                height: "170px",
                backgroundImage: `url(${drink.image})`,
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
                }}>{drink.tag}</span>

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
                <div style={{ fontWeight: "bold", fontSize: "16px", color: "#222" }}>
                  {drink.name}
                </div>
                <div style={{ fontSize: "12px", color: "#999", margin: "5px 0 12px", fontFamily: "sans-serif" }}>
                  {drink.desc}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "18px", fontWeight: "bold", color: "#2196f3", fontFamily: "sans-serif" }}>
                    ₹{drink.price}
                  </span>

                  {/* Add / Qty controls */}
                  {quantities[drink.name] ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button onClick={() => removeFromCart(drink)} style={qtyBtn("#2196f3")}>−</button>
                      <span style={{ fontWeight: "bold", fontFamily: "sans-serif", color: "#333" }}>
                        {quantities[drink.name]}
                      </span>
                      <button onClick={() => addToCart(drink)} style={qtyBtn("#2196f3")}>+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(drink)}
                      style={{
                        backgroundColor: addedItem === drink.name ? "#4caf50" : "#2196f3",
                        color: "white", border: "none",
                        padding: "8px 16px", borderRadius: "20px",
                        fontSize: "13px", cursor: "pointer",
                        fontFamily: "sans-serif", fontWeight: "bold",
                        transition: "background 0.3s"
                      }}
                    >
                      {addedItem === drink.name ? "✓ Added!" : "+ Add"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
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

export default Drinks;