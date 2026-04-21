import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Save token
        localStorage.setItem("token", data.token);
        localStorage.setItem("userName", name);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userPhone", data.phone || "");

        // ✅ Save full "user" object — Profile page reads this (was missing before!)
        localStorage.setItem("user", JSON.stringify({
          id:    data.id    || data.user?.id,
          name:  name,
          email: email,
          phone: data.phone || data.user?.phone || "",
        }));

        // ✅ Full page reload so Home re-reads localStorage and shows avatar
        window.location.href = "/";
      } else {
        setError(data.message || "Signup failed ❌");
      }
    } catch (err) {
      setError("Server not reachable. Is backend running? ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleSignup}>
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>🍔</div>
          <span style={styles.logoText}>Fresh<span style={{ color: "#e8534a" }}>Bite</span></span>
        </div>

        <h2 style={styles.heading}>Create your account</h2>
        <p style={styles.sub}>Join FreshBite and start ordering</p>

        <input
          type="text"
          placeholder="Full name"
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email address"
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up →"}
        </button>

        <p style={styles.link}>
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} style={styles.linkSpan}>
            Login
          </span>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "radial-gradient(ellipse at 60% 40%, rgba(232,83,74,0.08) 0%, transparent 60%), #fef6f5",
    fontFamily: "'Sora', sans-serif",
  },
  form: {
    background: "#fff",
    padding: "44px 40px",
    borderRadius: "24px",
    boxShadow: "0 8px 40px rgba(232,83,74,0.1)",
    width: "360px",
    textAlign: "center",
    border: "1px solid rgba(232,83,74,0.1)",
  },
  logoWrap: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "10px", marginBottom: "24px",
  },
  logoIcon: {
    width: "36px", height: "36px",
    background: "linear-gradient(135deg, #e8534a, #c0392b)",
    borderRadius: "10px", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "17px",
  },
  logoText: {
    fontSize: "20px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.5px",
  },
  heading: {
    fontSize: "22px", fontWeight: 800, color: "#1a1a1a", marginBottom: "6px",
  },
  sub: {
    fontSize: "14px", color: "#aaa", marginBottom: "28px",
  },
  input: {
    width: "100%",
    padding: "13px 16px",
    marginBottom: "14px",
    borderRadius: "12px",
    border: "1.5px solid #f0ece8",
    fontSize: "14px",
    fontFamily: "'Sora', sans-serif",
    background: "#fafaf9",
    outline: "none",
    boxSizing: "border-box",
    color: "#1a1a1a",
    transition: "border-color 0.2s",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #e8534a, #c0392b)",
    color: "#fff",
    border: "none",
    borderRadius: "50px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "6px",
    fontFamily: "'Sora', sans-serif",
    boxShadow: "0 6px 20px rgba(232,83,74,0.3)",
    transition: "all 0.3s",
  },
  error: {
    color: "#e8534a", fontSize: "13px", marginBottom: "10px",
    background: "rgba(232,83,74,0.06)", padding: "8px 12px",
    borderRadius: "8px",
  },
  link: {
    marginTop: "20px", fontSize: "13px", color: "#aaa",
  },
  linkSpan: {
    color: "#e8534a", cursor: "pointer", fontWeight: 700,
  },
};

export default Signup;