import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCartKey,
  addToCartStorage,
  getCartCount,
} from "../utils/cartUtils"; // ✅ shared utility

const categories = [
  {
    to: "/healthy",
    emoji: "🥗",
    label: "Healthy Food",
    desc: "Fresh, clean & nourishing",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
    color: "#4caf50",
  },
  {
    to: "/homemeals",
    emoji: "🍛",
    label: "Home Meals",
    desc: "Comfort food, just like home",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
    color: "#ff9800",
  },
  {
    to: "/sweets",
    emoji: "🍬",
    label: "Sweets",
    desc: "Desserts & sweet treats",
    image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80",
    color: "#e91e8c",
  },
  {
    to: "/drinks",
    emoji: "🍹",
    label: "Drinks",
    desc: "Juices, shakes & more",
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80",
    color: "#2196f3",
  },
  {
    to: "/italian",
    emoji: "🍕",
    label: "Italian",
    desc: "Pasta, pizza & classics",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",
    color: "#f44336",
  },
];

const featuredDishes = [
  {
    id: 1,
    name: "Paneer Butter Masala",
    tag: "⭐ Most Loved",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80",
    price: 220,
    category: "Home Meals",
  },
  {
    id: 2,
    name: "Hyderabadi Biryani",
    tag: "🔥 Bestseller",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
    price: 280,
    category: "Home Meals",
  },
  {
    id: 3,
    name: "Mango Smoothie",
    tag: "☀️ Summer Special",
    image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80",
    price: 120,
    category: "Drinks",
  },
  {
    id: 4,
    name: "Margherita Pizza",
    tag: "🍕 Chef's Pick",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80",
    price: 350,
    category: "Italian",
  },
  {
    id: 5,
    name: "Gulab Jamun",
    tag: "🍬 Sweet Treat",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80",
    price: 90,
    category: "Sweets",
  },
  {
    id: 6,
    name: "Caesar Salad",
    tag: "🥗 Healthy Pick",
    image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&q=80",
    price: 180,
    category: "Healthy Food",
  },
];

function Menu() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredDish, setHoveredDish] = useState(null);
  const [cartCount, setCartCount] = useState(getCartCount); // ✅ lazy init
  const [addedId, setAddedId] = useState(null);

  const handleAddToCart = (dish) => {
    addToCartStorage(dish); // ✅ uses shared utility
    setCartCount(getCartCount());
    setAddedId(dish.id);
    setTimeout(() => setAddedId(null), 1000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fdf6f0",
        fontFamily: "'Georgia', serif",
      }}
    >
      {/* ── Navbar ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "64px",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,107,107,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          zIndex: 1000,
          boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
        }}
      >
        <Link to="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: "22px",
              color: "#1a1a1a",
              fontFamily: "sans-serif",
            }}
          >
            Fresh<span style={{ color: "#ff6b6b" }}>Bite</span>
          </span>
        </Link>

        <div
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "center",
            fontFamily: "sans-serif",
          }}
        >
          <Link
            to="/menu"
            style={{
              textDecoration: "none",
              color: "#333",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Menu
          </Link>

          <div
            onClick={() => navigate("/cart")}
            style={{
              position: "relative",
              cursor: "pointer",
              background: "linear-gradient(135deg, #ff6b6b, #ff8e53)",
              color: "white",
              padding: "8px 18px",
              borderRadius: "30px",
              fontSize: "14px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 3px 12px rgba(255,107,107,0.35)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.04)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🛒 Cart
            {cartCount > 0 && (
              <span
                style={{
                  background: "white",
                  color: "#ff6b6b",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 800,
                }}
              >
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Hero Banner ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)",
          padding: "110px 30px 60px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%)",
          }}
        />
        <p
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: "14px",
            letterSpacing: "4px",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Welcome to FreshBite
        </p>
        <h1
          style={{
            color: "white",
            fontSize: "42px",
            margin: "0 0 12px",
            fontWeight: "bold",
            textShadow: "0 2px 10px rgba(0,0,0,0.15)",
          }}
        >
          What's on your mind? 🍽️
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: "16px",
            margin: "0 0 25px",
          }}
        >
          Freshly prepared, lovingly served
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("/recommend")}
            style={{
              backgroundColor: "white",
              color: "#ff6b6b",
              border: "none",
              padding: "12px 28px",
              borderRadius: "30px",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
            }}
          >
            ✨ Get AI Recommendations
          </button>
          <button
            onClick={() => navigate("/cart")}
            style={{
              backgroundColor: "transparent",
              color: "white",
              border: "2px solid rgba(255,255,255,0.7)",
              padding: "12px 28px",
              borderRadius: "30px",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🛒 View Cart {cartCount > 0 ? `(${cartCount})` : ""}
          </button>
        </div>
      </div>

      {/* ── Categories ── */}
      <div
        style={{
          padding: "50px 30px 20px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <h2 style={{ fontSize: "26px", color: "#333", marginBottom: "6px" }}>
          Browse Categories
        </h2>
        <p
          style={{
            color: "#999",
            fontSize: "14px",
            marginBottom: "30px",
          }}
        >
          Tap a category to explore dishes
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
            gap: "20px",
          }}
        >
          {categories.map((cat, i) => (
            <Link
              key={i}
              to={cat.to}
              style={{ textDecoration: "none" }}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow:
                    hoveredCard === i
                      ? "0 12px 30px rgba(0,0,0,0.18)"
                      : "0 4px 12px rgba(0,0,0,0.08)",
                  transform:
                    hoveredCard === i ? "translateY(-6px)" : "translateY(0)",
                  transition: "all 0.3s ease",
                  backgroundColor: "white",
                }}
              >
                <div
                  style={{
                    height: "130px",
                    backgroundImage: `url(${cat.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(to top, ${cat.color}cc, transparent)`,
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: "10px",
                      left: "12px",
                      fontSize: "26px",
                    }}
                  >
                    {cat.emoji}
                  </span>
                </div>
                <div style={{ padding: "14px" }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "15px",
                      color: "#222",
                    }}
                  >
                    {cat.label}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      marginTop: "3px",
                    }}
                  >
                    {cat.desc}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Featured Dishes ── */}
      <div
        style={{
          padding: "30px 30px 60px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <h2 style={{ fontSize: "26px", color: "#333", marginBottom: "6px" }}>
          ⭐ Featured Dishes
        </h2>
        <p
          style={{
            color: "#999",
            fontSize: "14px",
            marginBottom: "30px",
          }}
        >
          Hand-picked favourites from our kitchen
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "22px",
          }}
        >
          {featuredDishes.map((dish, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredDish(i)}
              onMouseLeave={() => setHoveredDish(null)}
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                backgroundColor: "white",
                boxShadow:
                  hoveredDish === i
                    ? "0 12px 30px rgba(0,0,0,0.15)"
                    : "0 4px 12px rgba(0,0,0,0.07)",
                transform:
                  hoveredDish === i ? "translateY(-5px)" : "translateY(0)",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  height: "160px",
                  backgroundImage: `url(${dish.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    color: "white",
                    fontSize: "11px",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontFamily: "sans-serif",
                  }}
                >
                  {dish.tag}
                </span>
              </div>

              <div style={{ padding: "14px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "14px",
                      color: "#222",
                    }}
                  >
                    {dish.name}
                  </div>
                  <div
                    style={{
                      color: "#ff6b6b",
                      fontWeight: "bold",
                      fontSize: "15px",
                      fontFamily: "sans-serif",
                    }}
                  >
                    ₹{dish.price}
                  </div>
                </div>

                <button
                  onClick={() => handleAddToCart(dish)}
                  style={{
                    width: "100%",
                    padding: "9px 0",
                    border: "none",
                    borderRadius: "12px",
                    background:
                      addedId === dish.id
                        ? "linear-gradient(135deg, #4caf50, #43a047)"
                        : "linear-gradient(135deg, #ff6b6b, #ff8e53)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "sans-serif",
                    transition: "all 0.3s ease",
                    boxShadow:
                      addedId === dish.id
                        ? "0 3px 12px rgba(76,175,80,0.35)"
                        : "0 3px 12px rgba(255,107,107,0.3)",
                    letterSpacing: "0.3px",
                  }}
                >
                  {addedId === dish.id ? "✓ Added!" : "+ Add to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer Strip ── */}
      <div
        style={{
          backgroundColor: "#ff6b6b",
          color: "white",
          textAlign: "center",
          padding: "20px",
          fontSize: "14px",
          fontFamily: "sans-serif",
        }}
      >
        🍽️ FreshBite — Made with love, served with passion
      </div>
    </div>
  );
}

export default Menu;