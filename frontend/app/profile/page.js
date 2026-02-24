"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const [user, setUser] = useState({ username: "", email: "" });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [newEmail, setNewEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState({ text: "", type: "" });
  const [message, setMessage] = useState({ text: "", type: "" });
  const router = useRouter();

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  // 1. Load User Info on Mount
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

  // 🛠️ FIX: Moved handleEmailUpdate OUT of the password function
  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setEmailMessage({ text: "", type: "" });

    const headers = getAuthHeader();
    try {
      const res = await axios.post(
        "https://localhost:7066/api/Auth/update-email",
        JSON.stringify(newEmail),
        {
          headers: { ...headers, "Content-Type": "application/json" },
        },
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

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-white p-12 font-sans">
      <Link
        href="/"
        className="text-indigo-400 text-xs font-black uppercase tracking-widest hover:text-indigo-300 transition-all mb-8 block"
      >
        ← Back to Dashboard
      </Link>

      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-5xl font-black tracking-tighter mb-2">
            Account Settings
          </h1>
          <p className="text-slate-500">
            Manage your profile and security preferences.
          </p>
        </header>

        {/* PROFILE SECTION */}
        <section className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
            User Information
          </h2>
          <div className="grid grid-cols-2 gap-6 mb-8 pb-8 border-b border-slate-800/50">
            <div>
              <p className="text-xs text-slate-400 mb-1">Username</p>
              <p className="font-bold text-xl">
                {user.username || "Loading..."}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Current Email</p>
              <p className="font-bold text-xl text-indigo-400">
                {user.email || "Loading..."}
              </p>
            </div>
          </div>

          {/* EMAIL UPDATE AREA */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">
              Change Email Address
            </p>
            <form onSubmit={handleEmailUpdate} className="flex gap-4">
              <input
                type="email"
                placeholder="Enter new email..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 outline-none focus:border-indigo-500 transition-all"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-indigo-600 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg"
              >
                Update
              </button>
            </form>

            <AnimatePresence>
              {emailMessage.text && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs font-bold uppercase tracking-widest ${emailMessage.type === "success" ? "text-emerald-400" : "text-rose-500"}`}
                >
                  {emailMessage.text}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* PASSWORD SECTION */}
        <section className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
            Security (Change Password)
          </h2>

          {message.text && (
            <div
              className={`p-4 rounded-xl text-xs font-black uppercase tracking-widest border mb-6 ${message.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-500"}`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <input
              type="password"
              placeholder="Old Password"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-indigo-500"
              value={passwordData.oldPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  oldPassword: e.target.value,
                })
              }
              required
            />
            <input
              type="password"
              placeholder="New Password"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-indigo-500"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              required
            />
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all">
              Update Security
            </button>
          </form>
        </section>

        {/* DANGER ZONE */}
        <section className="bg-rose-500/5 border border-rose-500/10 p-8 rounded-3xl">
          <h2 className="text-[10px] font-black text-rose-500/50 uppercase tracking-widest mb-6">
            Danger Zone
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-rose-500">Sign Out</p>
              <p className="text-xs text-slate-500">
                Ends your current session and clears local data.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-500/10"
            >
              Logout
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
