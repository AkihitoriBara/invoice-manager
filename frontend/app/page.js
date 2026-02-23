"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function ThreeColumnDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [category, setCategory] = useState("active");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentError, setPaymentError] = useState("");
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
      router.push("/login");
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  // --- DATA FETCHING ---
  const fetchInvoices = async () => {
    const headers = getAuthHeader();
    if (!headers) return;

    try {
      const response = await axios.get("https://localhost:7066/api/invoices", {
        headers,
      });
      setInvoices(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
      }
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
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
        console.error(err);
      });
  }, [selectedId]);

  // --- ACTIONS ---

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

    // INLINE GUARD: Check balance before sending
    if (amount > selectedInvoice.balanceDue) {
      setPaymentError(
        `Exceeds remaining balance of ${selectedInvoice.currency}${selectedInvoice.balanceDue.toFixed(2)}`,
      );
      return;
    }

    if (amount <= 0) {
      setPaymentError("Enter an amount greater than 0");
      return;
    }

    const headers = getAuthHeader();
    try {
      await axios.post(
        `https://localhost:7066/api/invoices/${selectedId}/payments`,
        { amount: amount },
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
      setPaymentError(err.response?.data || "System error during payment.");
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

  const handleToggleStatus = async (invoice) => {
    setSelectedId(null);
    setSelectedInvoice(null);

    const headers = getAuthHeader();
    const endpoint = invoice.isDeleted
      ? `https://localhost:7066/api/invoices/${invoice.id}/restore`
      : `https://localhost:7066/api/invoices/${invoice.id}`;

    try {
      if (invoice.isDeleted) {
        await axios.post(endpoint, {}, { headers });
      } else {
        await axios.delete(endpoint, { headers });
      }
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

  const handleEmptyTrash = async () => {
    setSelectedId(null);
    setSelectedInvoice(null);

    const headers = getAuthHeader();
    try {
      await axios.delete("https://localhost:7066/api/invoices/trash/empty", {
        headers,
      });
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
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

  return (
    <div className="flex h-screen bg-[#0a0f1d] text-white overflow-hidden font-sans">
      {/* COLUMN 1: NAVIGATION */}
      <div className="w-64 bg-slate-900/80 border-r border-slate-800 p-6 flex flex-col gap-2 backdrop-blur-xl">
        {/* BRAND AREA */}
        <div className="mb-10 px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 font-black text-xl italic">
              K
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none">
                Kuro<span className="text-indigo-500">Track</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                v1.0 • System
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 pl-2">
          Dashboard
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

        <div className="mt-auto pt-6 border-t border-slate-800/50">
          <button
            onClick={() => router.push("/profile")}
            className="w-full p-4 rounded-2xl text-left font-bold text-slate-300 hover:bg-slate-800/50 transition-all flex items-center justify-between group"
          >
            Profile Settings
            <span className="text-xs opacity-30 group-hover:opacity-100 transition-opacity">
              →
            </span>
          </button>
        </div>
      </div>

      {/* COLUMN 2: LIST */}
      <div className="w-96 bg-slate-900/20 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center h-20 sticky top-0 bg-[#0a0f1d]/50 backdrop-blur-md z-20">
          <div className="flex flex-col">
            <h2 className="text-xl font-black capitalize tracking-tight">
              {category}
            </h2>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {filteredList.length} total entries
            </span>
          </div>
          {category === "active" ? (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-8 h-8 bg-indigo-600 rounded-lg font-bold shadow-lg hover:bg-indigo-500 transition-all"
            >
              +
            </button>
          ) : category === "completed" && filteredList.length > 0 ? (
            <button
              onClick={handleTrashAllCompleted}
              className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Trash All
            </button>
          ) : (
            category === "trash" &&
            filteredList.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors"
              >
                Empty
              </button>
            )
          )}
        </div>

        {/* SEARCH BAR */}
        <div className="p-4 border-b border-slate-800/50">
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-800/20 border border-slate-800 animate-pulse"
              >
                <div className="h-4 w-3/4 bg-slate-700 rounded mb-3"></div>
                <div className="h-3 w-1/2 bg-slate-700/50 rounded"></div>
              </div>
            ))
          ) : filteredList.length > 0 ? (
            filteredList.map((inv) => (
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
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-slate-700 italic text-sm text-center">
              No invoices found
            </div>
          )}
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
              <div className="flex justify-between items-center mb-12 pb-6 border-b border-slate-800/50">
                <div className="flex items-center gap-4">
                  <span className="p-2 bg-slate-800 rounded-lg text-[10px] font-black text-slate-400 tracking-tighter uppercase">
                    #INV
                  </span>
                  <h1 className="text-5xl font-black tracking-tighter italic">
                    {selectedInvoice.invoiceNumber.split("-")[1]}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${selectedInvoice.status?.toUpperCase() === "PAID" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}
                  >
                    {selectedInvoice.status}
                  </div>
                  {!selectedInvoice.isDeleted && (
                    <button
                      onClick={() => {
                        setEditData(selectedInvoice);
                        setIsEditModalOpen(true);
                      }}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
                    >
                      Edit Details
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-10">
                <p className="text-slate-500 text-xl font-medium mb-4">
                  {selectedInvoice.customerName}
                </p>
                <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-600">
                  <div>
                    Created:{" "}
                    <span className="text-slate-400">
                      {new Date(selectedInvoice.createdAt).toLocaleDateString()}
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
                    className="bg-indigo-600/5 border border-indigo-500/10 p-8 rounded-3xl mb-8 relative"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">
                        Quick Pay System
                      </p>

                      {/* INLINE ERROR MESSAGE */}
                      <AnimatePresence>
                        {paymentError && (
                          <motion.span
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20"
                          >
                            {paymentError}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.01"
                          className={`w-full bg-slate-900 border ${paymentError ? "border-rose-500/50" : "border-slate-800"} rounded-xl p-4 outline-none focus:border-indigo-500 transition-all`}
                          placeholder="Enter amount..."
                          value={paymentAmount}
                          onChange={(e) => {
                            setPaymentAmount(e.target.value);
                            if (paymentError) setPaymentError("");
                          }}
                          onWheel={(e) => e.target.blur()}
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setPaymentAmount(
                              selectedInvoice.balanceDue.toString(),
                            );
                            setPaymentError("");
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded-md transition-colors"
                        >
                          Max
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="bg-indigo-600 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/10 hover:bg-indigo-500 transition-all"
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
                    className="w-full py-4 font-bold text-xs uppercase tracking-widest text-slate-600 hover:text-rose-600 transition-colors"
                  >
                    Delete Permanently from Database
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-700 italic text-lg text-center opacity-40">
              Select an invoice from the list to view system details
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* MODALS RENDERED HERE */}
      {isEditModalOpen && editData && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl max-w-md w-full shadow-2xl">
            <h2 className="text-3xl font-black mb-8 tracking-tight text-center italic">
              Edit Entry
            </h2>
            <form onSubmit={handleUpdate} className="space-y-6">
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-indigo-500 transition-all"
                value={editData.customerName}
                onChange={(e) =>
                  setEditData({ ...editData, customerName: e.target.value })
                }
                required
              />
              <input
                type="number"
                step="0.01"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-indigo-500 transition-all"
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
                  className="flex-1 font-black text-xs uppercase text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all"
                >
                  Update System
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl max-w-md w-full shadow-2xl">
            <h2 className="text-3xl font-black mb-8 tracking-tight text-center italic">
              New Entry
            </h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <input
                placeholder="Customer Name"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-indigo-500 transition-all"
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
                  className="col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-indigo-500 transition-all"
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
                  className="flex-1 font-black text-xs uppercase text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all"
                >
                  Create Entry
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
    <div className="bg-slate-800/30 p-8 rounded-3xl border border-slate-800/50 text-center backdrop-blur-sm">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
        {label}
      </p>
      <p className={`text-3xl font-black tracking-tighter ${color}`}>
        {currency || "$"}
        {(value || 0).toFixed(2)}
      </p>
    </div>
  );
}
