import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToCart as saveToGlobalCart, removeOneFromCart } from "../utils/cartUtils";

const healthyItems = [
  {
    name: "Fruit Bowl",
    desc: "Seasonal fresh fruits with honey drizzle & chia seeds",
    price: 150,
    tag: "🍓 Fan Favourite",
    cal: "180 kcal",
    image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80"
  },
  {
    name: "Veg Salad",
    desc: "Crisp veggies tossed in lemon herb dressing",
    price: 120,
    tag: "🥗 Classic",
    cal: "140 kcal",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80"
  },
  {
    name: "Oats Meal",
    desc: "Rolled oats with banana, almonds & honey",
    price: 100,
    tag: "🌾 High Fibre",
    cal: "220 kcal",
    image: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&q=80"
  },
  {
    name: "Caesar Salad",
    desc: "Romaine lettuce, croutons, parmesan & caesar dressing",
    price: 180,
    tag: "🧀 Chef's Pick",
    cal: "210 kcal",
    image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&q=80"
  },
  {
    name: "Avocado Toast",
    desc: "Multigrain toast topped with smashed avocado & seeds",
    price: 200,
    tag: "🥑 Trending",
    cal: "260 kcal",
    image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400&q=80"
  },
  {
    name: "Grilled Chicken Bowl",
    desc: "Grilled chicken breast with quinoa & roasted veggies",
    price: 280,
    tag: "💪 Protein Rich",
    cal: "380 kcal",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80"
  },
  {
    name: "Quinoa Bowl",
    desc: "Quinoa with roasted chickpeas, greens & tahini",
    price: 240,
    tag: "🌿 Superfood",
    cal: "320 kcal",
    image: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&q=80"
  },
  {
    name: "Sprouts Chaat",
    desc: "Mixed sprouts with tomato, onion & chaat masala",
    price: 90,
    tag: "🌱 Desi Healthy",
    cal: "160 kcal",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80"
  },
  {
    name: "Greek Yogurt Parfait",
    desc: "Layered yogurt with granola, berries & honey",
    price: 160,
    tag: "🍯 Light & Filling",
    cal: "195 kcal",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80"
  },
  {
    name: "Detox Green Bowl",
    desc: "Spinach, cucumber, kiwi & mint blended smooth",
    price: 170,
    tag: "🥦 Detox",
    cal: "130 kcal",
    image: "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&q=80"
  },
  {
    name: "Egg White Omelette",
    desc: "Fluffy egg whites with bell peppers & mushrooms",
    price: 140,
    tag: "🥚 High Protein",
    cal: "175 kcal",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80"
  },
  {
    name: "Multigrain Wrap",
    desc: "Multigrain wrap with hummus, greens & grilled tofu",
    price: 190,
    tag: "🌯 Power Meal",
    cal: "290 kcal",
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80"
  },
];

const accent = "#4caf50";

function Healthy() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [addedItem, setAddedItem] = useState(null);
  const [quantities, setQuantities] = useState({});

  const addToCart = (item) => {
    saveToGlobalCart({
      name: item.name,
      price: item.price,
      category: "Healthy",
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
    <div style={{ minHeight: "100vh", backgroundColor: "#f1faf1", fontFamily: "'Georgia', serif" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #4caf50, #81c784)",
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

        <h1 style={{ color: "white", fontSize: "38px", margin: "0 0 8px" }}>🥗 Healthy Food</h1>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", margin: 0 }}>
          Eat clean, feel great — nourish your body
        </p>

        <button
          onClick={() => navigate("/cart")}
          style={{
            position: "absolute", top: "20px", right: "20px",
            backgroundColor: "white", color: accent,
            border: "none", padding: "8px 18px",
            borderRadius: "20px", cursor: "pointer",
            fontWeight: "bold", fontSize: "14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}
        >
          🛒 Cart
        </button>
      </div>

      {/* ── Grid ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "24px"
        }}>
          {healthyItems.map((item, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: "white",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: hoveredCard === i
                  ? "0 14px 35px rgba(76,175,80,0.2)"
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
                  position: "absolute", bottom: "10px", right: "10px",
                  backgroundColor: "rgba(76,175,80,0.85)",
                  color: "white", fontSize: "11px",
                  padding: "3px 10px", borderRadius: "20px",
                  fontFamily: "sans-serif", fontWeight: "bold"
                }}>🔥 {item.cal}</span>
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

                  {quantities[item.name] ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button onClick={() => removeFromCart(item)} style={qtyBtn(accent)}>−</button>
                      <span style={{ fontWeight: "bold", fontFamily: "sans-serif", color: "#333" }}>
                        {quantities[item.name]}
                      </span>
                      <button onClick={() => addToCart(item)} style={qtyBtn(accent)}>+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      style={{
                        backgroundColor: addedItem === item.name ? "#81c784" : accent,
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

export default Healthy;