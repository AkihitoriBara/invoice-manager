"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Added for the register link

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // New state for visibility
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://localhost:7066/api/Auth/login",
        {
          email: email.toLowerCase().trim(), // 👈 Normalize before sending
          password: password,
        },
      );

      localStorage.setItem("token", response.data);
      router.push("/");
    } catch (err) {
      setError(
        err.response?.data || "Login failed. Please check your credentials.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center font-sans">
      <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">
          Welcome Back
        </h2>
        <p className="text-slate-500 text-sm mb-8 font-medium">
          Please sign in to manage your invoices.
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl text-xs font-black uppercase tracking-widest mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none text-white focus:border-indigo-500 transition-all"
              placeholder="name@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Password
            </label>
            <div className="relative">
              {" "}
              {/* Container for the toggle button */}
              <input
                type={showPassword ? "text" : "password"} // Conditional type
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 pr-16 outline-none text-white focus:border-indigo-500 transition-all"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
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
            Sign In
          </button>
        </form>

        {/* New link to registration page */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-xs font-medium">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-indigo-400 font-black uppercase tracking-widest hover:text-indigo-300 transition-colors"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
