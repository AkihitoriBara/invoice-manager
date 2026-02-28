"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ThreeColumnDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [category, setCategory] = useState("active");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [user, setUser] = useState({ username: "", email: "" });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPaid: 0,
    pendingBalance: 0,
    invoiceCount: 0,
  });
  const router = useRouter();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [newlyCreatedId, setNewlyCreatedId] = useState(null);

  const [newInvoiceData, setNewInvoiceData] = useState({
    customerName: "",
    total: 0,
    currency: "$",
    deadline: "",
    description: "",
    contactType: "Email",
    contactValue: "",
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setIsPaymentModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  const fetchInvoices = async () => {
    const headers = getAuthHeader();
    if (!headers) return;
    try {
      const [invRes, statsRes] = await Promise.all([
        axios.get("https://localhost:7066/api/invoices", { headers }),
        axios.get("https://localhost:7066/api/invoices/stats", { headers }),
      ]);
      setInvoices(Array.isArray(invRes.data) ? invRes.data : []);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Fetch Error:", err.response?.status, err.config?.url);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const headers = getAuthHeader();
    if (headers) {
      axios
        .get("https://localhost:7066/api/Auth/me", { headers })
        .then((res) => setUser(res.data))
        .catch(() => {});
      fetchInvoices();
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedInvoice(null);
      return;
    }
    const headers = getAuthHeader();
    axios
      .get(`https://localhost:7066/api/invoices/${selectedId}`, { headers })
      .then((res) => setSelectedInvoice(res.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          setSelectedId(null);
          setSelectedInvoice(null);
        }
      });
  }, [selectedId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const headers = getAuthHeader();
    const payload = {
      ...newInvoiceData,
      total: parseFloat(newInvoiceData.total),
      deadline: newInvoiceData.deadline === "" ? null : newInvoiceData.deadline,
      description: newInvoiceData.description || null,
    };
    try {
      const response = await axios.post(
        "https://localhost:7066/api/invoices",
        payload,
        { headers },
      );
      setIsCreateModalOpen(false);
      setNewInvoiceData({
        customerName: "",
        total: 0,
        currency: "$",
        deadline: "",
        description: "",
        contactType: "Email",
        contactValue: "",
      });
      fetchInvoices();
      setSelectedId(response.data.id);
      setNewlyCreatedId(response.data.id);
      setTimeout(() => setNewlyCreatedId(null), 30000);
    } catch (err) {
      alert("Creation failed.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const headers = getAuthHeader();
    try {
      await axios.put(
        `https://localhost:7066/api/invoices/${editData.id}`,
        {
          ...editData,
          total: parseFloat(editData.total),
          deadline: editData.deadline === "" ? null : editData.deadline,
          description: editData.description || null,
        },
        { headers },
      );
      setIsEditModalOpen(false);
      fetchInvoices();
      const detailRes = await axios.get(
        `https://localhost:7066/api/invoices/${editData.id}`,
        { headers },
      );
      setSelectedInvoice(detailRes.data);
    } catch (err) {
      alert("Update failed.");
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setPaymentError("");
    const amount = parseFloat(paymentAmount);
    if (amount > selectedInvoice.balanceDue) {
      setPaymentError(
        `Exceeds remaining balance of ${selectedInvoice.currency}${selectedInvoice.balanceDue.toFixed(2)}`,
      );
      return;
    }
    if (amount <= 0) return;
    const headers = getAuthHeader();
    try {
      await axios.post(
        `https://localhost:7066/api/invoices/${selectedId}/payments`,
        { amount },
        { headers },
      );
      setPaymentAmount("");
      setPaymentNote("");
      setIsPaymentModalOpen(false);
      fetchInvoices();
      const detailRes = await axios.get(
        `https://localhost:7066/api/invoices/${selectedId}`,
        { headers },
      );
      setSelectedInvoice(detailRes.data);
    } catch (err) {
      setPaymentError("System error.");
    }
  };

  const handleTrashAllCompleted = async () => {
    const headers = getAuthHeader();
    await axios.post(
      "https://localhost:7066/api/invoices/completed/trash",
      {},
      { headers },
    );
    setSelectedId(null);
    setSelectedInvoice(null);
    fetchInvoices();
  };

  const handleEmptyTrash = async () => {
    const headers = getAuthHeader();
    await axios.delete("https://localhost:7066/api/invoices/trash/empty", {
      headers,
    });
    setSelectedId(null);
    setSelectedInvoice(null);
    fetchInvoices();
  };

  const handleToggleStatus = async (invoice) => {
    setSelectedId(null);
    setSelectedInvoice(null);
    const headers = getAuthHeader();
    const endpoint = invoice.isDeleted
      ? `https://localhost:7066/api/invoices/${invoice.id}/restore`
      : `https://localhost:7066/api/invoices/${invoice.id}`;
    try {
      if (invoice.isDeleted) await axios.post(endpoint, {}, { headers });
      else await axios.delete(endpoint, { headers });
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDelete = async (id) => {
    setSelectedId(null);
    setSelectedInvoice(null);
    const headers = getAuthHeader();
    try {
      await axios.delete(
        `https://localhost:7066/api/invoices/${id}/permanent`,
        { headers },
      );
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const filteredList = invoices.filter((inv) => {
    const matchesSearch = inv.customerName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    if (category === "trash") return inv.isDeleted === true && matchesSearch;
    if (category === "completed")
      return inv.isDeleted === false && inv.status === "PAID" && matchesSearch;
    return inv.isDeleted === false && inv.status !== "PAID" && matchesSearch;
  });

  const counts = {
    active: invoices.filter((i) => !i.isDeleted && i.status !== "PAID").length,
    completed: invoices.filter((i) => !i.isDeleted && i.status === "PAID")
      .length,
    trash: invoices.filter((i) => i.isDeleted).length,
  };

  const isOverdue = (inv) =>
    inv.deadline &&
    new Date(inv.deadline) < new Date() &&
    inv.status !== "PAID" &&
    !inv.isDeleted;

  const s = {
    page: {
      minHeight: "100vh",
      background: "#f0f4f8",
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      display: "flex",
      flexDirection: "column",
    },
    nav: {
      background: "#ffffff",
      borderBottom: "1px solid #e5e7eb",
      padding: "0 32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: "60px",
      flexShrink: 0,
    },
    navLeft: { display: "flex", alignItems: "center", gap: "10px" },
    navIcon: {
      width: "36px",
      height: "36px",
      background: "linear-gradient(135deg, #4f6ef7 0%, #3d5ce8 100%)",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    navTitle: { fontWeight: "700", fontSize: "16px", color: "#1a1f36" },
    navBadge: {
      background: "linear-gradient(135deg, #4f6ef7, #3d5ce8)",
      color: "white",
      fontSize: "10px",
      fontWeight: "700",
      padding: "2px 8px",
      borderRadius: "20px",
      letterSpacing: "0.5px",
    },
    navRight: { display: "flex", alignItems: "center", gap: "12px" },
    navEmail: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      color: "#6b7280",
      fontSize: "13px",
      fontWeight: "500",
      border: "1.5px solid #e5e7eb",
      borderRadius: "20px",
      padding: "6px 14px",
    },
    logoutBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      color: "#6b7280",
      fontSize: "13px",
      fontWeight: "500",
      border: "1.5px solid #e5e7eb",
      borderRadius: "20px",
      padding: "6px 14px",
      background: "white",
      cursor: "pointer",
    },
    body: { display: "flex", flex: 1, padding: "24px", gap: "20px" },
    sidebar: { width: "220px", flexShrink: 0 },
    sidebarCard: {
      background: "#ffffff",
      borderRadius: "16px",
      border: "1.5px solid #e5e7eb",
      overflow: "hidden",
    },
    sidebarBtn: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "14px 18px",
      width: "100%",
      border: "none",
      background: active ? "#f0f3ff" : "white",
      color: active ? "#4f6ef7" : "#374151",
      fontSize: "14px",
      fontWeight: active ? "600" : "500",
      cursor: "pointer",
      textAlign: "left",
    }),
    sidebarDivider: { height: "1px", background: "#f3f4f6" },
    main: { flex: 1, display: "flex", flexDirection: "column", gap: "16px" },
    mainHeader: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    mainTitle: {
      fontSize: "28px",
      fontWeight: "800",
      color: "#1a1f36",
      margin: "0 0 4px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      letterSpacing: "-0.5px",
    },
    mainSub: { fontSize: "13px", color: "#9ca3af", margin: 0 },
    createBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 20px",
      background: "linear-gradient(135deg, #4f6ef7, #3d5ce8)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      boxShadow: "0 6px 20px rgba(79,110,247,0.3)",
      whiteSpace: "nowrap",
    },
    searchWrap: { position: "relative" },
    searchIcon: {
      position: "absolute",
      left: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
    },
    searchInput: {
      width: "100%",
      padding: "12px 16px 12px 44px",
      border: "1.5px solid #e5e7eb",
      borderRadius: "12px",
      fontSize: "14px",
      color: "#374151",
      background: "#ffffff",
      outline: "none",
      boxSizing: "border-box",
      fontFamily: "inherit",
    },
    tabBar: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      background: "#ffffff",
      borderRadius: "12px",
      border: "1.5px solid #e5e7eb",
      overflow: "hidden",
    },
    tab: (active) => ({
      padding: "13px",
      border: "none",
      background: active
        ? "linear-gradient(135deg, #4f6ef7, #3d5ce8)"
        : "white",
      color: active ? "white" : "#6b7280",
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.15s",
    }),
    contentArea: {
      background: "#ffffff",
      borderRadius: "16px",
      border: "1.5px solid #e5e7eb",
      padding: "24px",
      flex: 1,
    },
    invoiceCard: (active) => ({
      padding: "18px 20px",
      borderRadius: "14px",
      border: `1.5px solid ${active ? "#4f6ef7" : "#e5e7eb"}`,
      background: active ? "#f8f9ff" : "#ffffff",
      cursor: "pointer",
      marginBottom: "10px",
      position: "relative",
      transition: "all 0.15s",
      boxShadow: active ? "0 4px 16px rgba(79,110,247,0.1)" : "none",
    }),
    emptyState: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 0",
      gap: "16px",
    },
    emptyIcon: {
      width: "80px",
      height: "80px",
      borderRadius: "20px",
      background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#374151",
      margin: 0,
    },
    emptySub: { fontSize: "13px", color: "#9ca3af", margin: 0 },
    emptyBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 24px",
      background: "linear-gradient(135deg, #4f6ef7, #3d5ce8)",
      color: "white",
      border: "none",
      borderRadius: "20px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },
  };

  const modalOverlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: "16px",
  };
  const modalBox = {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "32px",
    maxWidth: "520px",
    width: "100%",
    boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
  };
  const modalInput = {
    width: "100%",
    padding: "12px 16px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#1a1f36",
    background: "#f9fafb",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    marginBottom: 0,
  };

  const FieldLabel = ({ text, required, optional }) => (
    <label
      style={{
        display: "block",
        fontSize: "13px",
        fontWeight: "600",
        color: "#374151",
        marginBottom: "7px",
      }}
    >
      {text}
      {required && <span style={{ color: "#4f6ef7" }}> *</span>}
      {optional && (
        <span style={{ color: "#9ca3af", fontWeight: "400" }}> (Optional)</span>
      )}
    </label>
  );

  const ContactPills = ({ contactType, onChange }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {[
        { value: "Email", label: "Email Address" },
        { value: "Phone", label: "Phone Number" },
      ].map((opt) => (
        <div
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "13px 16px",
            borderRadius: "12px",
            border: `1.5px solid ${contactType === opt.value ? "#4f6ef7" : "#e5e7eb"}`,
            background: contactType === opt.value ? "#f0f3ff" : "#f9fafb",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              flexShrink: 0,
              border: `2px solid ${contactType === opt.value ? "#4f6ef7" : "#d1d5db"}`,
              background: contactType === opt.value ? "#4f6ef7" : "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {contactType === opt.value && (
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "white",
                }}
              />
            )}
          </div>
          <span
            style={{
              fontSize: "14px",
              fontWeight: "500",
              color: contactType === opt.value ? "#4f6ef7" : "#374151",
            }}
          >
            {opt.label}
          </span>
        </div>
      ))}
    </div>
  );

  const CalendarIcon = () => (
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );

  return (
    <div style={s.page}>
      {/* TOP NAV */}
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <div style={s.navIcon}>
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
          <span style={s.navTitle}>InvoiceHub</span>
          <span style={s.navBadge}>PRO</span>
        </div>
        <div style={s.navRight}>
          <div style={s.navEmail}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            {user.email || "Loading..."}
          </div>
          <button
            style={s.logoutBtn}
            onClick={handleLogout}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#4f6ef7";
              e.currentTarget.style.color = "#4f6ef7";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.color = "#6b7280";
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </nav>

      {/* BODY */}
      <div style={s.body}>
        {/* SIDEBAR */}
        <div style={s.sidebar}>
          <div style={s.sidebarCard}>
            <Link href="/profile" style={{ textDecoration: "none" }}>
              <button
                style={s.sidebarBtn(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                }}
              >
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
                Profile
              </button>
            </Link>
            <div style={s.sidebarDivider} />
            <Link href="/profile" style={{ textDecoration: "none" }}>
              <button
                style={s.sidebarBtn(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                }}
              >
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
                Settings
              </button>
            </Link>
          </div>
        </div>

        {/* MAIN */}
        <div style={s.main}>
          <div style={s.mainHeader}>
            <div>
              <h1 style={s.mainTitle}>
                Your Invoices
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#4f6ef7">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                </svg>
              </h1>
              <p style={s.mainSub}>
                Manage and track your professional invoices
              </p>
            </div>
            <button
              style={s.createBtn}
              onClick={() => setIsCreateModalOpen(true)}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Invoice
            </button>
          </div>

          {/* Search */}
          <div style={s.searchWrap}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={s.searchIcon}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search invoices by name, contact, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={s.searchInput}
              onFocus={(e) => (e.target.style.borderColor = "#4f6ef7")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>

          {/* Tabs */}
          <div style={s.tabBar}>
            {[
              { key: "active", label: "Active" },
              { key: "completed", label: "Completed" },
              { key: "trash", label: "Trash" },
            ].map((tab) => (
              <button
                key={tab.key}
                style={s.tab(category === tab.key)}
                onClick={() => {
                  setCategory(tab.key);
                  setSelectedId(null);
                }}
              >
                {tab.label} ({counts[tab.key]})
              </button>
            ))}
          </div>

          {/* Bulk actions */}
          {category === "completed" && filteredList.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleTrashAllCompleted}
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "6px 14px",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Trash All
              </button>
            </div>
          )}
          {category === "trash" && filteredList.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleEmptyTrash}
                style={{
                  fontSize: "12px",
                  color: "#ef4444",
                  border: "1.5px solid #fecaca",
                  borderRadius: "8px",
                  padding: "6px 14px",
                  background: "#fff5f5",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Empty Trash
              </button>
            </div>
          )}

          {/* Content */}
          <div style={s.contentArea}>
            {loading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "72px",
                    borderRadius: "12px",
                    background: "#f3f4f6",
                    marginBottom: "10px",
                  }}
                />
              ))
            ) : filteredList.length === 0 ? (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>
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
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                    <line x1="8" y1="17" x2="16" y2="17" />
                  </svg>
                </div>
                <p style={s.emptyTitle}>
                  {category === "active"
                    ? "No active invoices"
                    : category === "completed"
                      ? "No completed invoices"
                      : "Trash is empty"}
                </p>
                <p style={s.emptySub}>
                  {category === "active"
                    ? "Get started by creating your first invoice"
                    : category === "completed"
                      ? "Paid invoices will appear here"
                      : "Deleted invoices will appear here"}
                </p>
                {category === "active" && (
                  <button
                    style={s.emptyBtn}
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Create your first invoice
                  </button>
                )}
              </div>
            ) : (
              filteredList.map((inv) => (
                <div
                  key={inv.id}
                  style={s.invoiceCard(selectedId === inv.id)}
                  onClick={() =>
                    setSelectedId(selectedId === inv.id ? null : inv.id)
                  }
                >
                  {newlyCreatedId === inv.id && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        background: "#4f6ef7",
                        color: "white",
                        fontSize: "9px",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "20px",
                      }}
                    >
                      NEW
                    </span>
                  )}

                  {/* Card header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: "600",
                          fontSize: "15px",
                          color: "#1a1f36",
                          margin: 0,
                        }}
                      >
                        {inv.customerName}
                      </p>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#9ca3af"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {selectedId === inv.id ? (
                          <polyline points="18 15 12 9 6 15" />
                        ) : (
                          <polyline points="6 9 12 15 18 9" />
                        )}
                      </svg>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {isOverdue(inv) && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            background: "#ef4444",
                            color: "white",
                          }}
                        >
                          Overdue
                        </span>
                      )}
                      <p
                        style={{
                          fontWeight: "700",
                          fontSize: "14px",
                          color: "#1a1f36",
                          margin: 0,
                        }}
                      >
                        {inv.currency}
                        {inv.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      margin: "3px 0 0",
                    }}
                  >
                    {inv.invoiceNumber}
                  </p>

                  {/* Expanded panel */}
                  {selectedId === inv.id && selectedInvoice && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                          marginTop: "16px",
                          paddingTop: "16px",
                          borderTop: "1px solid #e5e7eb",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Description */}
                        {selectedInvoice.description && (
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#6b7280",
                              margin: "0 0 14px",
                              lineHeight: 1.6,
                            }}
                          >
                            {selectedInvoice.description}
                          </p>
                        )}

                        {/* Info rows */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            marginBottom: "16px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "11px 14px",
                              background: "#f9fafb",
                              borderRadius: "10px",
                              border: "1px solid #f0f0f0",
                            }}
                          >
                            <div
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "8px",
                                background:
                                  "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {selectedInvoice.contactType === "Email" ? (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#4f6ef7"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect
                                    x="2"
                                    y="4"
                                    width="20"
                                    height="16"
                                    rx="2"
                                  />
                                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                              ) : (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#4f6ef7"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a2 2 0 0 1 2-2.18h3" />
                                </svg>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#374151",
                                fontWeight: "500",
                              }}
                            >
                              {selectedInvoice.contactValue}
                            </span>
                          </div>

                          {selectedInvoice.deadline && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "11px 14px",
                                background: "#f9fafb",
                                borderRadius: "10px",
                                border: "1px solid #f0f0f0",
                              }}
                            >
                              <div
                                style={{
                                  width: "30px",
                                  height: "30px",
                                  borderRadius: "8px",
                                  background:
                                    "linear-gradient(135deg, #ede9fe, #ddd6fe)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#7c3aed"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                  />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                              </div>
                              <span
                                style={{
                                  fontSize: "13px",
                                  color: "#374151",
                                  fontWeight: "500",
                                }}
                              >
                                Due:{" "}
                                {new Date(
                                  selectedInvoice.deadline,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Total amount + Add Payment */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 16px",
                            background:
                              "linear-gradient(135deg, #f0f3ff, #e8edff)",
                            borderRadius: "14px",
                            border: "1px solid #dde4ff",
                            marginBottom: "16px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <div
                              style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "10px",
                                background:
                                  "linear-gradient(135deg, #4f6ef7, #3d5ce8)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <svg
                                width="17"
                                height="17"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                              </svg>
                            </div>
                            <div>
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "#6b7280",
                                  margin: "0 0 2px",
                                  fontWeight: "500",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.04em",
                                }}
                              >
                                Total Amount
                              </p>
                              <p
                                style={{
                                  fontSize: "20px",
                                  fontWeight: "800",
                                  color: "#4f6ef7",
                                  margin: 0,
                                  letterSpacing: "-0.3px",
                                }}
                              >
                                {selectedInvoice.currency}
                                {selectedInvoice.total.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          {selectedInvoice.status?.toUpperCase() !== "PAID" &&
                          !selectedInvoice.isDeleted ? (
                            <button
                              onClick={() => {
                                setPaymentAmount("");
                                setPaymentNote("");
                                setPaymentError("");
                                setIsPaymentModalOpen(true);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "7px",
                                padding: "10px 18px",
                                background: "#22c55e",
                                color: "white",
                                border: "none",
                                borderRadius: "20px",
                                fontSize: "13px",
                                fontWeight: "600",
                                cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
                                whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.opacity = "0.9")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.opacity = "1")
                              }
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              Add Payment
                            </button>
                          ) : (
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "700",
                                color: "#16a34a",
                                background: "#f0fff4",
                                border: "1px solid #bbf7d0",
                                padding: "6px 14px",
                                borderRadius: "20px",
                              }}
                            >
                              ✓ Fully Paid
                            </span>
                          )}
                        </div>

                        {/* Payment history */}
                        {selectedInvoice.payments &&
                          selectedInvoice.payments.length > 0 && (
                            <div style={{ marginBottom: "16px" }}>
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "#9ca3af",
                                  fontWeight: "600",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  margin: "0 0 8px",
                                }}
                              >
                                Payment History
                              </p>
                              {selectedInvoice.payments.map((p) => (
                                <div
                                  key={p.id}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "9px 12px",
                                    background: "#f0fff4",
                                    borderRadius: "8px",
                                    marginBottom: "6px",
                                    border: "1px solid #dcfce7",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "13px",
                                      color: "#16a34a",
                                      fontWeight: "600",
                                    }}
                                  >
                                    +{selectedInvoice.currency}
                                    {p.amount.toFixed(2)}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "12px",
                                      color: "#9ca3af",
                                    }}
                                  >
                                    {new Date(
                                      p.paymentDate,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                        {/* Action buttons */}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          {!selectedInvoice.isDeleted && (
                            <button
                              onClick={() => {
                                setEditData({
                                  ...selectedInvoice,
                                  deadline: selectedInvoice.deadline
                                    ? selectedInvoice.deadline.split("T")[0]
                                    : "",
                                });
                                setIsEditModalOpen(true);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "9px 18px",
                                background: "white",
                                color: "#374151",
                                border: "1.5px solid #e5e7eb",
                                borderRadius: "20px",
                                fontSize: "13px",
                                fontWeight: "600",
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
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Edit
                            </button>
                          )}
                          {!selectedInvoice.isDeleted &&
                            selectedInvoice.status?.toUpperCase() !==
                              "PAID" && (
                              <button
                                onClick={() =>
                                  handleToggleStatus({
                                    ...selectedInvoice,
                                    status: "PAID",
                                  })
                                }
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "9px 18px",
                                  background: "#22c55e",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "20px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  boxShadow: "0 4px 10px rgba(34,197,94,0.25)",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.opacity = "0.9")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.opacity = "1")
                                }
                              >
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Complete
                              </button>
                            )}
                          {!selectedInvoice.isDeleted && (
                            <button
                              onClick={() =>
                                handleToggleStatus(selectedInvoice)
                              }
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "9px 18px",
                                background: "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: "20px",
                                fontSize: "13px",
                                fontWeight: "600",
                                cursor: "pointer",
                                boxShadow: "0 4px 10px rgba(239,68,68,0.25)",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.opacity = "0.9")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.opacity = "1")
                              }
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                              Delete
                            </button>
                          )}
                          {selectedInvoice.isDeleted && (
                            <>
                              <button
                                onClick={() =>
                                  handleToggleStatus(selectedInvoice)
                                }
                                style={{
                                  padding: "9px 18px",
                                  background: "#22c55e",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "20px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                              >
                                Restore
                              </button>
                              <button
                                onClick={() =>
                                  handlePermanentDelete(selectedInvoice.id)
                                }
                                style={{
                                  padding: "9px 18px",
                                  background: "transparent",
                                  color: "#9ca3af",
                                  border: "1.5px solid #e5e7eb",
                                  borderRadius: "20px",
                                  fontSize: "13px",
                                  fontWeight: "500",
                                  cursor: "pointer",
                                }}
                              >
                                Delete Permanently
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── PAYMENT MODAL ── */}
      {isPaymentModalOpen && selectedInvoice && (
        <div style={modalOverlay} onClick={() => setIsPaymentModalOpen(false)}>
          <div
            style={{ ...modalBox, maxWidth: "440px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "800",
                  color: "#1a1f36",
                  margin: 0,
                  letterSpacing: "-0.3px",
                }}
              >
                Record Payment
              </h2>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "1.5px solid #e5e7eb",
                  background: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  fontSize: "18px",
                }}
              >
                ×
              </button>
            </div>

            {/* Remaining balance */}
            <div
              style={{
                padding: "16px 18px",
                background: "linear-gradient(135deg, #f0f3ff, #e8edff)",
                borderRadius: "14px",
                border: "1px solid #dde4ff",
                marginBottom: "24px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  fontWeight: "500",
                  margin: "0 0 4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Remaining Balance
              </p>
              <p
                style={{
                  fontSize: "28px",
                  fontWeight: "800",
                  color: "#4f6ef7",
                  margin: 0,
                  letterSpacing: "-0.5px",
                }}
              >
                {selectedInvoice.currency}
                {selectedInvoice.balanceDue.toFixed(2)}
              </p>
            </div>

            <form onSubmit={handlePayment}>
              <div style={{ marginBottom: "18px" }}>
                <FieldLabel
                  text={`Payment Amount (${selectedInvoice.currency})`}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value);
                    if (paymentError) setPaymentError("");
                  }}
                  onWheel={(e) => e.target.blur()}
                  style={{
                    ...modalInput,
                    fontSize: "16px",
                    border: `1.5px solid ${paymentError ? "#fecaca" : "#e5e7eb"}`,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4f6ef7";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = paymentError
                      ? "#fecaca"
                      : "#e5e7eb";
                    e.target.style.background = "#f9fafb";
                  }}
                />
                {paymentError && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#ef4444",
                      margin: "6px 0 0",
                    }}
                  >
                    {paymentError}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: "28px" }}>
                <FieldLabel text="Note" optional />
                <textarea
                  placeholder="Add a note about this payment..."
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  style={{ ...modalInput, height: "90px", resize: "none" }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4f6ef7";
                    e.target.style.background = "#fff";
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
                    flex: 1,
                    padding: "14px",
                    background: "linear-gradient(135deg, #4f6ef7, #3d5ce8)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 6px 16px rgba(79,110,247,0.3)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Add Payment
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "14px",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "12px",
                    background: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#6b7280",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                    e.currentTarget.style.color = "#374151";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.color = "#6b7280";
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {isCreateModalOpen && (
        <div style={modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div
            style={{ ...modalBox, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "28px",
              }}
            >
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "800",
                  color: "#1a1f36",
                  margin: 0,
                  letterSpacing: "-0.3px",
                }}
              >
                Create New Invoice
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "1.5px solid #e5e7eb",
                  background: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  fontSize: "18px",
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: "18px" }}>
                <FieldLabel text="Invoice Name" required />
                <input
                  placeholder="e.g., Website Development Project"
                  required
                  value={newInvoiceData.customerName}
                  onChange={(e) =>
                    setNewInvoiceData({
                      ...newInvoiceData,
                      customerName: e.target.value,
                    })
                  }
                  style={modalInput}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4f6ef7";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.background = "#f9fafb";
                  }}
                />
              </div>
              <div style={{ marginBottom: "18px" }}>
                <FieldLabel text="Description" optional />
                <textarea
                  placeholder="Add any additional details about this invoice..."
                  value={newInvoiceData.description}
                  onChange={(e) =>
                    setNewInvoiceData({
                      ...newInvoiceData,
                      description: e.target.value,
                    })
                  }
                  style={{ ...modalInput, height: "90px", resize: "none" }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4f6ef7";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.background = "#f9fafb";
                  }}
                />
              </div>
              <div style={{ marginBottom: "18px" }}>
                <FieldLabel text="Contact Method" required />
                <ContactPills
                  contactType={newInvoiceData.contactType}
                  onChange={(val) =>
                    setNewInvoiceData({
                      ...newInvoiceData,
                      contactType: val,
                      contactValue: "",
                    })
                  }
                />
              </div>
              <div style={{ marginBottom: "18px" }}>
                <FieldLabel
                  text={
                    newInvoiceData.contactType === "Email"
                      ? "Email Address"
                      : "Phone Number"
                  }
                  required
                />
                <input
                  type={
                    newInvoiceData.contactType === "Email" ? "email" : "tel"
                  }
                  placeholder={
                    newInvoiceData.contactType === "Email"
                      ? "client@example.com"
                      : "+1 234 567 8900"
                  }
                  value={newInvoiceData.contactValue}
                  required
                  onChange={(e) =>
                    setNewInvoiceData({
                      ...newInvoiceData,
                      contactValue: e.target.value,
                    })
                  }
                  style={modalInput}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4f6ef7";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.background = "#f9fafb";
                  }}
                />
              </div>
              <div style={{ marginBottom: "18px" }}>
                <FieldLabel
                  text={`Total Amount (${newInvoiceData.currency})`}
                  required
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <select
                    value={newInvoiceData.currency}
                    onChange={(e) =>
                      setNewInvoiceData({
                        ...newInvoiceData,
                        currency: e.target.value,
                      })
                    }
                    style={{
                      padding: "12px 10px",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: "12px",
                      fontSize: "14px",
                      background: "#f9fafb",
                      outline: "none",
                      cursor: "pointer",
                      color: "#374151",
                      fontFamily: "inherit",
                    }}
                  >
                    <option value="$">$ USD</option>
                    <option value="€">€ EUR</option>
                    <option value="£">£ GBP</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={
                      newInvoiceData.total === 0 ? "" : newInvoiceData.total
                    }
                    onChange={(e) =>
                      setNewInvoiceData({
                        ...newInvoiceData,
                        total:
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value),
                      })
                    }
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: "12px",
                      fontSize: "14px",
                      background: "#f9fafb",
                      outline: "none",
                      fontFamily: "inherit",
                      color: "#1a1f36",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4f6ef7";
                      e.target.style.background = "#fff";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.background = "#f9fafb";
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: "28px" }}>
                <FieldLabel text="Deadline" required />
                <div style={{ position: "relative" }}>
                  <CalendarIcon />
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={newInvoiceData.deadline}
                    onChange={(e) =>
                      setNewInvoiceData({
                        ...newInvoiceData,
                        deadline: e.target.value,
                      })
                    }
                    style={{
                      ...modalInput,
                      paddingLeft: "44px",
                      color: newInvoiceData.deadline ? "#374151" : "#9ca3af",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4f6ef7";
                      e.target.style.background = "#fff";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.background = "#f9fafb";
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "linear-gradient(135deg, #4f6ef7, #3d5ce8)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 6px 16px rgba(79,110,247,0.3)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Create Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "14px",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "12px",
                    background: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#6b7280",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                    e.currentTarget.style.color = "#374151";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.color = "#6b7280";
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {isEditModalOpen && editData && (
        <div style={modalOverlay} onClick={() => setIsEditModalOpen(false)}>
          <div
            style={{ ...modalBox, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "28px",
              }}
            >
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "800",
                  color: "#1a1f36",
                  margin: 0,
                  letterSpacing: "-0.3px",
                }}
              >
                Edit Invoice
              </h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "1.5px solid #e5e7eb",
                  background: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  fontSize: "18px",
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: "18px" }}>
                <FieldLabel text="Invoice Name" required />
                <input
                  required
                  value={editData.customerName}
                  onChange={(e) =>
                    setEditData({ ...editData, customerName: e.target.value })
                  }
                  style={modalInput}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4f6ef7";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.background = "#f9fafb";
                  }}
                />
              </div>
              <div style={{ marginBottom: "18px" }}>
                <FieldLabel text="Description" optional />
                <textarea
                  placeholder="Add any additional details..."
                  value={editData.description || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  style={{ ...modalInput, height: "90px", resize: "none" }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4f6ef7";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.background = "#f9fafb";
                  }}
                />
              </div>
              <div style={{ marginBottom: "18px" }}>
                <FieldLabel text="Contact Method" required />
                <ContactPills
                  contactType={editData.contactType}
                  onChange={(val) =>
                    setEditData({ ...editData, contactType: val })
                  }
                />
              </div>
              <div style={{ marginBottom: "18px" }}>
                <FieldLabel
                  text={
                    editData.contactType === "Email"
                      ? "Email Address"
                      : "Phone Number"
                  }
                  required
                />
                <input
                  type={editData.contactType === "Email" ? "email" : "tel"}
                  value={editData.contactValue}
                  required
                  onChange={(e) =>
                    setEditData({ ...editData, contactValue: e.target.value })
                  }
                  style={modalInput}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4f6ef7";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.background = "#f9fafb";
                  }}
                />
              </div>
              <div style={{ marginBottom: "18px" }}>
                <FieldLabel
                  text={`Total Amount (${editData.currency})`}
                  required
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <div
                    style={{
                      padding: "12px 16px",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: "12px",
                      background: "#f9fafb",
                      fontSize: "14px",
                      color: "#6b7280",
                      display: "flex",
                      alignItems: "center",
                      fontWeight: "600",
                    }}
                  >
                    {editData.currency}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editData.total}
                    onChange={(e) =>
                      setEditData({ ...editData, total: e.target.value })
                    }
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: "12px",
                      fontSize: "14px",
                      background: "#f9fafb",
                      outline: "none",
                      color: "#1a1f36",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4f6ef7";
                      e.target.style.background = "#fff";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.background = "#f9fafb";
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: "28px" }}>
                <FieldLabel text="Deadline" required />
                <div style={{ position: "relative" }}>
                  <CalendarIcon />
                  <input
                    type="date"
                    required
                    value={editData.deadline || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, deadline: e.target.value })
                    }
                    style={{
                      ...modalInput,
                      paddingLeft: "44px",
                      color: editData.deadline ? "#374151" : "#9ca3af",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4f6ef7";
                      e.target.style.background = "#fff";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.background = "#f9fafb";
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "linear-gradient(135deg, #4f6ef7, #3d5ce8)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 6px 16px rgba(79,110,247,0.3)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Update Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "14px",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "12px",
                    background: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#6b7280",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                    e.currentTarget.style.color = "#374151";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.color = "#6b7280";
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
