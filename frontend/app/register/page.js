"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const sanitizedData = {
      username: formData.username,
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
    };

    try {
      await axios.post(
        "https://localhost:7066/api/Auth/register",
        sanitizedData,
      );
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err.response?.data || "Registration failed. Try again.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #e8eef7 0%, #dce6f5 50%, #e4eaf5 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "24px",
      }}
    >
      {/* Card */}
      <div
        style={{
          background: "#ffffff",
          width: "100%",
          maxWidth: "420px",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(100, 130, 200, 0.15)",
          padding: "48px 40px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            background: "linear-gradient(135deg, #4f6ef7 0%, #3d5ce8 100%)",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "28px",
            boxShadow: "0 8px 24px rgba(79, 110, 247, 0.3)",
          }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
            <line x1="8" y1="9" x2="10" y2="9" />
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1a1f36",
            margin: "0 0 8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            letterSpacing: "-0.5px",
          }}
        >
          Create Account{" "}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="#4f6ef7"
            style={{ flexShrink: 0 }}
          >
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#8a94a6",
            margin: "0 0 36px",
            fontWeight: "400",
          }}
        >
          Start your premium journey today
        </p>

        {error && (
          <div
            style={{
              width: "100%",
              background: "#fff5f5",
              border: "1px solid #fed7d7",
              color: "#e53e3e",
              padding: "12px 16px",
              borderRadius: "12px",
              fontSize: "13px",
              marginBottom: "20px",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              width: "100%",
              background: "#f0fff4",
              border: "1px solid #c6f6d5",
              color: "#38a169",
              padding: "12px 16px",
              borderRadius: "12px",
              fontSize: "13px",
              marginBottom: "20px",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            Account created! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleRegister} style={{ width: "100%" }}>
          {/* Username Field */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Username
            </label>
            <div style={{ position: "relative" }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <input
                type="text"
                placeholder="Your name"
                required
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "13px 16px 13px 44px",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "14px",
                  color: "#1a1f36",
                  background: "#f9fafb",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4f6ef7";
                  e.target.style.background = "#ffffff";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.background = "#f9fafb";
                }}
              />
            </div>
          </div>

          {/* Email Field */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Email
            </label>
            <div style={{ position: "relative" }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                type="email"
                placeholder="you@example.com"
                required
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "13px 16px 13px 44px",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "14px",
                  color: "#1a1f36",
                  background: "#f9fafb",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4f6ef7";
                  e.target.style.background = "#ffffff";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.background = "#f9fafb";
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "13px 44px 13px 44px",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "14px",
                  color: "#1a1f36",
                  background: "#f9fafb",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4f6ef7";
                  e.target.style.background = "#ffffff";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.background = "#f9fafb";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0",
                  color: "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div style={{ marginBottom: "28px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Confirm Password
            </label>
            <div style={{ position: "relative" }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "13px 44px 13px 44px",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "14px",
                  color: "#1a1f36",
                  background: "#f9fafb",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4f6ef7";
                  e.target.style.background = "#ffffff";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.background = "#f9fafb";
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0",
                  color: "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showConfirmPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Create Account Button */}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "15px",
              background: "linear-gradient(135deg, #4f6ef7 0%, #3d5ce8 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(79, 110, 247, 0.35)",
              transition: "opacity 0.2s, transform 0.1s",
              letterSpacing: "0.3px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.92")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.98)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Create Account
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            marginTop: "28px",
            fontSize: "13px",
            color: "#8a94a6",
            textAlign: "center",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "#4f6ef7",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
