import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Menu from "./pages/Menu";
import Sweets from "./pages/Sweets";
import Drinks from "./pages/Drinks";
import Italian from "./pages/Italian";
import HomeMeals from "./pages/HomeMeals";
import Healthy from "./pages/Healthy";
import Recommendation from "./pages/Recommendation";
import Profile from "./pages/Profile";
import Cart from "./pages/cart";
import NearestSellers from "./pages/Nearestsellers";
import SellerOnboarding from "./pages/SellerOnboarding";
import SellerDashboard from "./pages/SellerDashboard";
import SellerLogin from "./pages/Sellerlogin";
import DeliveryTracking from "./pages/Deliverytracking";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/recommend" element={<Recommendation />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/sweets" element={<Sweets />} />
        <Route path="/drinks" element={<Drinks />} />
        <Route path="/italian" element={<Italian />} />
        <Route path="/homemeals" element={<HomeMeals />} />
        <Route path="/healthy" element={<Healthy />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/nearby-sellers" element={<NearestSellers />} />
        <Route path="/seller/login" element={<SellerLogin />} />
        <Route path="/seller/register" element={<SellerOnboarding />} />
        <Route path="/seller/signup" element={<SellerOnboarding />} />
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/delivery/:orderId" element={<DeliveryTracking />} />
        <Route path="/delivery-tracking/:orderId" element={<DeliveryTracking />} />
        <Route path="/delivery-tracking" element={<DeliveryTracking />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;