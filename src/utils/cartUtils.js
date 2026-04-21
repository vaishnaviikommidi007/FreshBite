// src/utils/cartUtils.js
// ✅ Single source of truth for all cart operations — import this in every component
 
export const getCartKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const id = user?.id || user?.user_id || user?._id;
    return id ? `cart_${id}` : "cart_guest";
  } catch {
    return "cart_guest";
  }
};
 
export const getCart = () =>
  JSON.parse(localStorage.getItem(getCartKey())) || [];
 
export const saveCart = (cart) =>
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
 
export const addToCartStorage = (dish) => {
  const cart = getCart();
  const existing = cart.find((i) => i.id === dish.id);
  if (existing) existing.quantity += 1;
  else cart.push({ ...dish, quantity: 1 });
  saveCart(cart);
};
export const addToCart = (dish) => {
  const cart = getCart();
  const existing = cart.find((i) => i.id === dish.id);
  if (existing) existing.quantity += 1;
  else cart.push({ ...dish, quantity: 1 });
  saveCart(cart);
};
export const removeOneFromCart = (itemId) => {
  let cart = getCart();
  const existing = cart.find((i) => i.id === itemId);
  if (existing) {
    if (existing.quantity > 1) existing.quantity -= 1;
    else cart = cart.filter((i) => i.id !== itemId);
  }
  saveCart(cart);
};
 
export const getCartCount = () =>
  getCart().reduce((sum, item) => sum + item.quantity, 0);
 
// Merges guest / legacy cart keys into the current user-specific key
export const migrateCart = () => {
  const key = getCartKey();
  let stored = JSON.parse(localStorage.getItem(key) || "[]");
 
  for (const fallbackKey of ["cart_guest", "cart"]) {
    if (stored.length === 0 && key !== fallbackKey) {
      const old = JSON.parse(localStorage.getItem(fallbackKey) || "[]");
      if (old.length > 0) {
        stored = old;
        localStorage.setItem(key, JSON.stringify(stored));
        localStorage.removeItem(fallbackKey);
        break;
      }
    }
  }
  return stored;
};
 