"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState({ username: "", email: "" });
  const [newEmail, setNewEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState({ text: "", type: "" });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const router = useRouter();

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const headers = getAuthHeader();
    if (headers) {
      axios
        .get("https://localhost:7066/api/Auth/me", { headers })
        .then((res) => setUser(res.data))
        .catch(() =>
          setMessage({ text: "Failed to load profile", type: "error" }),
        );
    }
  }, []);

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setEmailMessage({ text: "", type: "" });
    const headers = getAuthHeader();
    try {
      const res = await axios.post(
        "https://localhost:7066/api/Auth/update-email",
        JSON.stringify(newEmail),
        { headers: { ...headers, "Content-Type": "application/json" } },
      );
      setUser({ ...user, email: res.data.email });
      setEmailMessage({ text: res.data.message, type: "success" });
      setNewEmail("");
    } catch (err) {
      setEmailMessage({
        text: err.response?.data || "Failed to update email.",
        type: "error",
      });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    const headers = getAuthHeader();
    try {
      await axios.post(
        "https://localhost:7066/api/Auth/change-password",
        passwordData,
        { headers },
      );
      setMessage({ text: "Password updated successfully!", type: "success" });
      setPasswordData({ oldPassword: "", newPassword: "" });
      setShowChangePassword(false);
    } catch (err) {
      setMessage({
        text: err.response?.data || "Update failed",
        type: "error",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const tabs = [
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ),
    },
    {
      id: "security",
      label: "Security",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
  ];

  const inputStyle = {
    width: "100%",
    padding: "12px 16px 12px 44px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#1a1f36",
    background: "#f9fafb",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f4f8",
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top Nav */}
      <nav
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "60px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #4f6ef7 0%, #3d5ce8 100%)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="20"
              height="20"
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
            </svg>
          </div>
          <span
            style={{ fontWeight: "700", fontSize: "16px", color: "#1a1f36" }}
          >
            InvoiceHub
          </span>
          <span
            style={{
              background: "linear-gradient(135deg, #4f6ef7, #3d5ce8)",
              color: "white",
              fontSize: "10px",
              fontWeight: "700",
              padding: "2px 8px",
              borderRadius: "20px",
              letterSpacing: "0.5px",
            }}
          >
            PRO
          </span>
        </div>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#374151",
            fontSize: "13px",
            fontWeight: "500",
            textDecoration: "none",
            border: "1.5px solid #e5e7eb",
            borderRadius: "20px",
            padding: "6px 16px",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </nav>

      {/* Page Body */}
      <div
        style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 24px" }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "800",
            color: "#1a1f36",
            margin: "0 0 28px",
            letterSpacing: "-0.5px",
          }}
        >
          Settings
        </h1>

        {/* Tabs */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            background: "#ffffff",
            border: "1.5px solid #e5e7eb",
            borderRadius: "40px",
            padding: "4px",
            marginBottom: "28px",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMessage({ text: "", type: "" });
                setEmailMessage({ text: "", type: "" });
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 18px",
                borderRadius: "40px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                transition: "all 0.2s",
                background:
                  activeTab === tab.id
                    ? "linear-gradient(135deg, #4f6ef7, #3d5ce8)"
                    : "transparent",
                color: activeTab === tab.id ? "#ffffff" : "#6b7280",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1.5px solid #e5e7eb",
              padding: "32px",
            }}
          >
            <h2
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#1a1f36",
                margin: "0 0 4px",
              }}
            >
              Profile Settings
            </h2>
            <p
              style={{ fontSize: "13px", color: "#9ca3af", margin: "0 0 28px" }}
            >
              Update your profile information
            </p>

            {/* Avatar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "28px",
                paddingBottom: "28px",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "18px",
                    background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4f6ef7"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "-4px",
                    right: "-4px",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4f6ef7, #3d5ce8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid white",
                    cursor: "pointer",
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </div>
              <div>
                <p
                  style={{
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "#1a1f36",
                    margin: "0 0 2px",
                  }}
                >
                  Profile Picture
                </p>
                <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
                  Upload a professional photo
                </p>
              </div>
            </div>

            {/* Username */}
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
                  width="16"
                  height="16"
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
                  value={user.username}
                  readOnly
                  style={{ ...inputStyle, color: "#6b7280" }}
                />
              </div>
            </div>

            {/* Email */}
            <form onSubmit={handleEmailUpdate}>
              <div style={{ marginBottom: "24px" }}>
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
                    width="16"
                    height="16"
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
                    placeholder={user.email || "Enter new email..."}
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: "48px" }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4f6ef7";
                      e.target.style.background = "#ffffff";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.background = "#f9fafb";
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #4f6ef7, #3d5ce8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                </div>
                {emailMessage.text && (
                  <p
                    style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color:
                        emailMessage.type === "success" ? "#38a169" : "#e53e3e",
                    }}
                  >
                    {emailMessage.text}
                  </p>
                )}
              </div>

              <button
                type="submit"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #4f6ef7, #3d5ce8)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(79,110,247,0.3)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Save Changes
              </button>
            </form>
          </div>
        )}

        {/* ── APPEARANCE TAB ── */}
        {activeTab === "appearance" && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1.5px solid #e5e7eb",
              padding: "32px",
            }}
          >
            <h2
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#1a1f36",
                margin: "0 0 4px",
              }}
            >
              Appearance
            </h2>
            <p
              style={{ fontSize: "13px", color: "#9ca3af", margin: "0 0 28px" }}
            >
              Customize how InvoiceHub looks for you
            </p>

            <p
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#1a1f36",
                marginBottom: "16px",
              }}
            >
              Theme Mode
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "28px",
              }}
            >
              {/* Light Mode */}
              <div
                style={{
                  border: "2px solid #4f6ef7",
                  borderRadius: "16px",
                  padding: "28px 20px",
                  background: "#f5f7ff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, #4f6ef7, #3d5ce8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontWeight: "600",
                      fontSize: "14px",
                      color: "#1a1f36",
                      margin: "0 0 2px",
                    }}
                  >
                    Light Mode
                  </p>
                  <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>
                    Bright and clean
                  </p>
                </div>
              </div>
              {/* Dark Mode */}
              <div
                style={{
                  border: "1.5px solid #e5e7eb",
                  borderRadius: "16px",
                  padding: "28px 20px",
                  background: "#f9fafb",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: "#e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontWeight: "600",
                      fontSize: "14px",
                      color: "#1a1f36",
                      margin: "0 0 2px",
                    }}
                  >
                    Dark Mode
                  </p>
                  <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>
                    Easy on the eyes
                  </p>
                </div>
              </div>
            </div>

            {/* Premium Experience Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #f0f3ff, #e8edff)",
                borderRadius: "16px",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  flexShrink: 0,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #4f6ef7, #3d5ce8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </div>
              <div>
                <p
                  style={{
                    fontWeight: "700",
                    fontSize: "14px",
                    color: "#1a1f36",
                    margin: "0 0 4px",
                  }}
                >
                  Premium Experience
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                  Your theme preference is automatically saved and applied
                  across all your devices for a seamless experience.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === "security" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Password & Security */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                border: "1.5px solid #e5e7eb",
                padding: "32px",
              }}
            >
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#1a1f36",
                  margin: "0 0 4px",
                }}
              >
                Password & Security
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "#9ca3af",
                  margin: "0 0 24px",
                }}
              >
                Manage your account security
              </p>

              {message.text && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    marginBottom: "20px",
                    background:
                      message.type === "success" ? "#f0fff4" : "#fff5f5",
                    border: `1px solid ${message.type === "success" ? "#c6f6d5" : "#fed7d7"}`,
                    color: message.type === "success" ? "#38a169" : "#e53e3e",
                  }}
                >
                  {message.text}
                </div>
              )}

              {!showChangePassword ? (
                <button
                  onClick={() => setShowChangePassword(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "12px",
                    background: "white",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#4f6ef7";
                    e.currentTarget.style.color = "#4f6ef7";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.color = "#374151";
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Change Password
                </button>
              ) : (
                <form
                  onSubmit={handleUpdatePassword}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    maxWidth: "400px",
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <svg
                      width="16"
                      height="16"
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
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      type="password"
                      placeholder="Current password"
                      required
                      value={passwordData.oldPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          oldPassword: e.target.value,
                        })
                      }
                      style={inputStyle}
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
                  <div style={{ position: "relative" }}>
                    <svg
                      width="16"
                      height="16"
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
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      type="password"
                      placeholder="New password"
                      required
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      style={inputStyle}
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
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="submit"
                      style={{
                        padding: "11px 22px",
                        background: "linear-gradient(135deg, #4f6ef7, #3d5ce8)",
                        color: "white",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Update Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePassword(false);
                        setMessage({ text: "", type: "" });
                      }}
                      style={{
                        padding: "11px 22px",
                        background: "transparent",
                        color: "#6b7280",
                        border: "1.5px solid #e5e7eb",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: "500",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Danger Zone */}
            <div
              style={{
                background: "#fff8f8",
                borderRadius: "20px",
                border: "1.5px solid #fecaca",
                padding: "32px",
              }}
            >
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#dc2626",
                  margin: "0 0 4px",
                }}
              >
                Danger Zone
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "#9ca3af",
                  margin: "0 0 24px",
                }}
              >
                Irreversible actions
              </p>
              <button
                onClick={handleLogout}
                style={{
                  padding: "11px 24px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(220,38,38,0.25)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#b91c1c")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#dc2626")
                }
              >
                Logout of Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
