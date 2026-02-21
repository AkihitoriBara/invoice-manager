"use client";
import { useState, useEffect, use } from "react";

export default function InvoicePage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;

  const [invoice, setInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  // Function to fetch or refresh data
  const fetchInvoice = () => {
    fetch(`https://localhost:7066/api/invoices/${id}`)
      .then((res) => res.json())
      .then((data) => setInvoice(data))
      .catch((err) => console.error("Error fetching invoice:", err));
  };

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  // --- NEW: Handle Delete Function ---
  const handleDelete = async () => {
    if (confirm("Are you sure you want to permanently remove this record?")) {
      try {
        const res = await fetch(`https://localhost:7066/api/invoices/${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          window.location.href = "/"; // Go back to the dashboard list
        } else {
          alert("Failed to delete. Make sure the backend method exists.");
        }
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  // Handle Add Payment
  const handlePayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);

    if (isNaN(amount) || amount <= 0 || amount > invoice.balanceDue) {
      alert("Please enter a valid amount within the balance due.");
      return;
    }

    const response = await fetch(
      `https://localhost:7066/api/invoices/${id}/payments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount }),
      },
    );

    if (response.ok) {
      setPaymentAmount("");
      setIsModalOpen(false);
      fetchInvoice(); // Refresh data to show new payment and updated balance
    } else {
      alert("Payment failed. Please check the backend.");
    }
  };

  if (!invoice)
    return (
      <div className="p-10 text-center text-slate-500 font-medium">
        Loading Invoice {id}...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-12 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200 relative">
        {/* Header Section */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-white">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-800">
              {invoice.invoiceNumber}
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              {invoice.customerName}
            </p>
          </div>
          <div
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${invoice.status === "PAID" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}
          >
            {invoice.status}
          </div>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-slate-100">
          <div className="p-8 border-r border-slate-100 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
              Total Amount
            </p>
            <p className="text-2xl font-bold text-slate-800">
              ${invoice.total.toFixed(2)}
            </p>
          </div>
          <div className="p-8 border-r border-slate-100 text-center bg-slate-50/30">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
              Amount Paid
            </p>
            <p className="text-2xl font-bold text-emerald-500">
              ${invoice.amountPaid.toFixed(2)}
            </p>
          </div>
          <div className="p-8 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
              Balance Due
            </p>
            <p className="text-2xl font-bold text-rose-500">
              ${invoice.balanceDue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="p-8">
          <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest border-l-4 border-indigo-500 pl-3">
            Line Items
          </h3>
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold text-slate-400 border-b border-slate-100">
                <th className="pb-4">Description</th>
                <th className="pb-4 text-center">Qty</th>
                <th className="pb-4 text-right">Unit Price</th>
                <th className="pb-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoice.lineItems?.map((item) => (
                <tr key={item.id} className="text-slate-600">
                  <td className="py-5 font-medium">{item.description}</td>
                  <td className="py-5 text-sm text-center">{item.quantity}</td>
                  <td className="py-5 text-sm text-right">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-5 font-bold text-slate-800 text-right">
                    ${item.lineTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payments List & Add Button */}
        <div className="p-8 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">
            Recent Payments
          </h3>
          <div className="space-y-3">
            {invoice.payments?.length > 0 ? (
              invoice.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm"
                >
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-700">
                      Payment Received
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-bold text-emerald-500">
                    +${p.amount.toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No payments yet.</p>
            )}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={invoice.status === "PAID"}
            className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
          >
            {invoice.status === "PAID" ? "Fully Paid" : "Add Payment"}
          </button>

          {/* --- NEW: Remove Button Placement --- */}
          <button
            onClick={handleDelete}
            className="mt-6 w-full text-slate-400 hover:text-rose-500 font-bold py-2 text-sm transition-colors border-t border-slate-200 pt-6"
          >
            Remove Record Permanently
          </button>
        </div>
      </div>

      {/* --- PAYMENT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-slate-800 mb-2">
              Record Payment
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Enter the amount received from the customer.
            </p>

            <form onSubmit={handlePayment}>
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  placeholder="0.00"
                />
                <p className="mt-2 text-xs text-slate-400 text-right">
                  Max allowed: ${invoice.balanceDue.toFixed(2)}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 font-bold text-slate-400 hover:text-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}