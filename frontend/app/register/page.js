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
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Normalize the payload: Lowercase and Trim the email
    const sanitizedData = {
      ...formData,
      email: formData.email.toLowerCase().trim(),
    };

    try {
      // 📡 Sending the SANITIZED data to your Register endpoint
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
    <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center font-sans">
      <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">
          Create Account
        </h2>
        <p className="text-slate-500 text-sm mb-8 font-medium">
          Join the Invoice Manager platform.
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl text-xs font-black uppercase tracking-widest mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-black uppercase tracking-widest mb-6">
            Account created! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Username
            </label>
            <input
              type="text"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none text-white focus:border-indigo-500 transition-all"
              placeholder="username"
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none text-white focus:border-indigo-500 transition-all"
              placeholder="name@example.com"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 pr-16 outline-none text-white focus:border-indigo-500 transition-all"
                placeholder="••••••••"
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-500 hover:text-indigo-400 transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all mt-4"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-xs font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-400 font-black uppercase tracking-widest hover:text-indigo-300 transition-colors"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
