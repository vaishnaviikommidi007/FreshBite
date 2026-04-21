// src/api/cartApi.js
// ─────────────────────────────────────────────────────────────
//  All cart operations go through these helpers.
//  Import and use these in Menu.jsx, Cart.jsx, etc.
// ─────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:5000/api";

// Pull user_id from wherever your app stores it after login
export const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.id || user?.user_id || user?._id || null;
  } catch {
    return null;
  }
};

// ── Fetch full cart for logged-in user ──────────────────────
export const fetchCart = async () => {
  const userId = getUserId();
  if (!userId) return [];

  const res  = await fetch(`${API_BASE}/cart/${userId}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to fetch cart");
  return data.cart;          // array of cart items from DB
};

// ── Add item (or increment if already in cart) ──────────────
export const addToCart = async (item) => {
  const userId = getUserId();
  if (!userId) throw new Error("User not logged in");

  const res = await fetch(`${API_BASE}/cart/add`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id:  userId,
      food_id:  item.id,          // your food item's id
      name:     item.name,
      price:    item.price,
      quantity: item.quantity || 1,
      image:    item.image  || null,
      category: item.category || null,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to add item");
  return data.cart;           // full updated cart from DB
};

// ── Update quantity (pass 0 to auto-remove) ─────────────────
export const updateCartItem = async (foodId, quantity) => {
  const userId = getUserId();
  if (!userId) throw new Error("User not logged in");

  const res = await fetch(`${API_BASE}/cart/update`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, food_id: foodId, quantity }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to update item");
  return data.cart;
};

// ── Remove a specific item ───────────────────────────────────
export const removeFromCart = async (foodId) => {
  const userId = getUserId();
  if (!userId) throw new Error("User not logged in");

  const res = await fetch(`${API_BASE}/cart/remove`, {
    method:  "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, food_id: foodId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to remove item");
  return data.cart;
};

// ── Clear entire cart (call after successful order) ──────────
export const clearCart = async () => {
  const userId = getUserId();
  if (!userId) return;

  await fetch(`${API_BASE}/cart/clear/${userId}`, { method: "DELETE" });
};