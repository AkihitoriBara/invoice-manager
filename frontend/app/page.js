"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios"; // 1. Added Axios
import { useRouter } from "next/navigation"; // 2. Changed to next/navigation for App Router

export default function ThreeColumnDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [category, setCategory] = useState("active");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const router = useRouter();

  // UI STATES
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [newlyCreatedId, setNewlyCreatedId] = useState(null);

  const [newInvoiceData, setNewInvoiceData] = useState({
    customerName: "",
    total: 0,
    currency: "$",
    deadline: "",
  });

  // --- SECURITY: GET TOKEN & HEADERS ---
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login"); // Redirect if no token found
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  // --- DATA FETCHING (UPGRADED TO AXIOS) ---
  const fetchInvoices = async () => {
    const headers = getAuthHeader();
    if (!headers) return;

    try {
      const response = await axios.get("https://localhost:7066/api/invoices", {
        headers,
      });
      setInvoices(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.response?.status === 401) router.push("/login"); // Kick to login if token expired
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (selectedId) {
      const headers = getAuthHeader();
      axios
        .get(`https://localhost:7066/api/invoices/${selectedId}`, { headers })
        .then((res) => setSelectedInvoice(res.data))
        .catch((err) => console.error(err));
    }
  }, [selectedId]);

  // --- ACTIONS (UPGRADED TO AXIOS) ---

  const handleCreate = async (e) => {
    e.preventDefault();
    const headers = getAuthHeader();
    const payload = {
      ...newInvoiceData,
      total: parseFloat(newInvoiceData.total),
      deadline: newInvoiceData.deadline === "" ? null : newInvoiceData.deadline,
    };

    try {
      const response = await axios.post(
        "https://localhost:7066/api/invoices",
        payload,
        { headers },
      );
      setIsCreateModalOpen(false);
      fetchInvoices();
      setSelectedId(response.data.id);
      setNewlyCreatedId(response.data.id);
      setTimeout(() => setNewlyCreatedId(null), 30000);
    } catch (err) {
      alert("Creation failed. Ensure you are logged in.");
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
        },
        { headers },
      );

      setIsEditModalOpen(false);
      fetchInvoices();
      // Refresh details
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
    const headers = getAuthHeader();
    try {
      await axios.post(
        `https://localhost:7066/api/invoices/${selectedId}/payments`,
        { amount: parseFloat(paymentAmount) },
        { headers },
      );
      setPaymentAmount("");
      fetchInvoices();
      const detailRes = await axios.get(
        `https://localhost:7066/api/invoices/${selectedId}`,
        { headers },
      );
      setSelectedInvoice(detailRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrashAllCompleted = async () => {
    if (confirm("Move all completed invoices to trash?")) {
      const headers = getAuthHeader();
      await axios.post(
        "https://localhost:7066/api/invoices/completed/trash",
        {},
        { headers },
      );
      setSelectedId(null);
      setSelectedInvoice(null);
      fetchInvoices();
    }
  };

  const handleToggleStatus = async (invoice) => {
    const headers = getAuthHeader();
    const endpoint = invoice.isDeleted
      ? `https://localhost:7066/api/invoices/${invoice.id}/restore`
      : `https://localhost:7066/api/invoices/${invoice.id}`;

    if (invoice.isDeleted) {
      await axios.post(endpoint, {}, { headers });
    } else {
      await axios.delete(endpoint, { headers });
    }
    setSelectedId(null);
    setSelectedInvoice(null);
    fetchInvoices();
  };

  const handlePermanentDelete = async (id) => {
    if (confirm("This cannot be undone. Delete this invoice forever?")) {
      const headers = getAuthHeader();
      const response = await axios.delete(
        `https://localhost:7066/api/invoices/${id}/permanent`,
        { headers },
      );
      if (response.status === 200) {
        setSelectedId(null);
        setSelectedInvoice(null);
        fetchInvoices();
      }
    }
  };

  const handleEmptyTrash = async () => {
    if (
      confirm(
        "Are you sure? This will permanently delete ALL items in the trash.",
      )
    ) {
      const headers = getAuthHeader();
      const response = await axios.delete(
        "https://localhost:7066/api/invoices/trash/empty",
        { headers },
      );
      if (response.status === 200) {
        setSelectedId(null);
        setSelectedInvoice(null);
        fetchInvoices();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const filteredList = invoices.filter((inv) => {
    if (category === "trash") return inv.isDeleted === true;
    if (category === "completed")
      return inv.isDeleted === false && inv.status === "PAID";
    return inv.isDeleted === false && inv.status !== "PAID";
  });

  return (
    <div className="flex h-screen bg-[#0a0f1d] text-white overflow-hidden font-sans">
      {/* COLUMN 1: NAVIGATION */}
      <div className="w-64 bg-slate-900/50 border-r border-slate-800 p-6 flex flex-col gap-2">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 text-center">
          Navigation
        </h2>
        <NavButton
          label="Active Invoices"
          active={category === "active"}
          onClick={() => {
            setCategory("active");
            setSelectedId(null);
          }}
        />
        <NavButton
          label="Complete Invoice"
          active={category === "completed"}
          onClick={() => {
            setCategory("completed");
            setSelectedId(null);
          }}
        />
        <NavButton
          label="Deleted Invoice"
          active={category === "trash"}
          onClick={() => {
            setCategory("trash");
            setSelectedId(null);
          }}
        />

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="w-full p-4 rounded-2xl text-left font-bold text-rose-500 hover:bg-rose-500/10 transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      {/* COLUMN 2: LIST */}
      <div className="w-96 bg-slate-900/20 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center h-20">
          <h2 className="text-xl font-black capitalize">{category}</h2>
          {category === "active" ? (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-8 h-8 bg-indigo-600 rounded-lg font-bold shadow-lg hover:bg-indigo-500"
            >
              +
            </button>
          ) : category === "completed" && filteredList.length > 0 ? (
            <button
              onClick={handleTrashAllCompleted}
              className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
            >
              Move All to Trash
            </button>
          ) : (
            category === "trash" &&
            filteredList.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400"
              >
                Empty Trash
              </button>
            )
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredList.map((inv) => (
            <div
              key={inv.id}
              onClick={() => setSelectedId(inv.id)}
              className={`relative p-5 rounded-2xl cursor-pointer border transition-all ${selectedId === inv.id ? "bg-indigo-600/20 border-indigo-500 shadow-lg" : "bg-slate-800/30 border-slate-800 hover:border-slate-600"}`}
            >
              {newlyCreatedId === inv.id && (
                <span className="absolute -top-2 -right-2 bg-indigo-500 text-[8px] font-black px-2 py-1 rounded-full shadow-lg animate-pulse z-10">
                  NEW
                </span>
              )}
              <p className="font-bold text-lg">{inv.customerName}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] font-black opacity-40 uppercase">
                  {inv.invoiceNumber}
                </span>
                <span className="font-black text-slate-300">
                  {inv.currency}
                  {inv.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COLUMN 3: DETAILS */}
      <div className="flex-1 p-12 overflow-y-auto bg-[#0a0f1d]">
        <AnimatePresence mode="wait">
          {selectedInvoice ? (
            <motion.div
              key={selectedInvoice.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-6xl font-black tracking-tighter">
                      {selectedInvoice.invoiceNumber}
                    </h1>
                    {!selectedInvoice.isDeleted && (
                      <button
                        onClick={() => {
                          setEditData(selectedInvoice);
                          setIsEditModalOpen(true);
                        }}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <p className="text-slate-500 text-xl font-medium mb-4">
                    {selectedInvoice.customerName}
                  </p>
                  <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-600">
                    <div>
                      Created:{" "}
                      <span className="text-slate-400">
                        {new Date(
                          selectedInvoice.createdAt,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedInvoice.deadline && (
                      <div>
                        Deadline:{" "}
                        <span className="text-rose-500">
                          {new Date(
                            selectedInvoice.deadline,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedInvoice.status?.toUpperCase() === "PAID" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}
                >
                  {selectedInvoice.status}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-12">
                <StatCard
                  label="Total Amount"
                  value={selectedInvoice.total}
                  currency={selectedInvoice.currency}
                  color="text-slate-100"
                />
                <StatCard
                  label="Amount Paid"
                  value={selectedInvoice.amountPaid}
                  currency={selectedInvoice.currency}
                  color="text-emerald-400"
                />
                <StatCard
                  label="Balance Due"
                  value={selectedInvoice.balanceDue}
                  currency={selectedInvoice.currency}
                  color="text-rose-500"
                />
              </div>

              {selectedInvoice.status?.toUpperCase() !== "PAID" &&
                !selectedInvoice.isDeleted && (
                  <form
                    onSubmit={handlePayment}
                    className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-3xl mb-8"
                  >
                    <p className="text-xs font-black uppercase text-indigo-400 tracking-widest mb-4">
                      Quick Pay
                    </p>
                    <div className="flex gap-4">
                      <input
                        type="number"
                        step="0.01"
                        className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1 outline-none"
                        placeholder="Amount to pay..."
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        onWheel={(e) => e.target.blur()}
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 px-8 py-4 rounded-xl font-bold shadow-xl shadow-indigo-500/20"
                      >
                        Confirm
                      </button>
                    </div>
                  </form>
                )}

              <div className="space-y-4 pt-6 border-t border-slate-800">
                <button
                  onClick={() => handleToggleStatus(selectedInvoice)}
                  className={`w-full py-6 rounded-2xl font-black text-sm uppercase transition-all border-2 ${selectedInvoice.isDeleted ? "border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10" : "border-slate-800 text-slate-500 hover:border-rose-500 hover:text-rose-500"}`}
                >
                  {selectedInvoice.isDeleted
                    ? "Restore to Active"
                    : "Move to Trash"}
                </button>
                {selectedInvoice.isDeleted && (
                  <button
                    onClick={() => handlePermanentDelete(selectedInvoice.id)}
                    className="w-full py-4 font-bold text-xs uppercase tracking-widest text-slate-600 hover:text-rose-600"
                  >
                    Delete Permanently from Database
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-700 italic text-lg text-center">
              Select an invoice from the list to view details
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && editData && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl max-w-md w-full shadow-2xl">
            <h2 className="text-3xl font-black mb-8 tracking-tight text-center">
              Edit Entry
            </h2>
            <form onSubmit={handleUpdate} className="space-y-6">
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none"
                value={editData.customerName}
                onChange={(e) =>
                  setEditData({ ...editData, customerName: e.target.value })
                }
                required
              />
              <input
                type="number"
                step="0.01"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none"
                value={editData.total}
                onChange={(e) =>
                  setEditData({ ...editData, total: e.target.value })
                }
                onWheel={(e) => e.target.blur()}
                required
              />
              <input
                type="date"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none text-slate-400"
                value={editData.deadline ? editData.deadline.split("T")[0] : ""}
                onChange={(e) =>
                  setEditData({ ...editData, deadline: e.target.value })
                }
              />
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 py-4 rounded-xl font-bold shadow-xl"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl max-w-md w-full shadow-2xl">
            <h2 className="text-3xl font-black mb-8 tracking-tight text-center">
              New Entry
            </h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <input
                placeholder="Customer Name"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none"
                onChange={(e) =>
                  setNewInvoiceData({
                    ...newInvoiceData,
                    customerName: e.target.value,
                  })
                }
                required
              />
              <div className="grid grid-cols-3 gap-4">
                <select
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none appearance-none"
                  onChange={(e) =>
                    setNewInvoiceData({
                      ...newInvoiceData,
                      currency: e.target.value,
                    })
                  }
                >
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  className="col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none"
                  placeholder="Amount"
                  onChange={(e) =>
                    setNewInvoiceData({
                      ...newInvoiceData,
                      total: e.target.value,
                    })
                  }
                  onWheel={(e) => e.target.blur()}
                  required
                />
              </div>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none text-slate-400"
                onChange={(e) =>
                  setNewInvoiceData({
                    ...newInvoiceData,
                    deadline: e.target.value,
                  })
                }
              />
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 py-4 rounded-xl font-bold hover:bg-indigo-500 transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NavButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl text-left font-bold transition-all ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"}`}
    >
      {label}
    </button>
  );
}

function StatCard({ label, value, currency, color }) {
  return (
    <div className="bg-slate-800/30 p-8 rounded-3xl border border-slate-800/50 text-center">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
        {label}
      </p>
      <p className={`text-3xl font-black ${color}`}>
        {currency || "$"}
        {(value || 0).toFixed(2)}
      </p>
    </div>
  );
}
