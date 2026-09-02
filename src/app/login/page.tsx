"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Building2, User, KeyRound, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError("");
    setIsLoading(true);

    const userToLogin = customUser || username;
    const passToLogin = customPass || password;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userToLogin, password: passToLogin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal masuk. Periksa kembali username dan password.");
        setIsLoading(false);
        return;
      }

      router.push(data.redirectUrl);
      router.refresh();
    } catch (err) {
      setError("Terjadi kendala jaringan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const quickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    handleLogin(undefined, u, p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans selection:bg-blue-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Brand Header */}
        <div className="bg-slate-900 px-8 py-8 text-white text-center relative overflow-hidden">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">RMH Facility Hub</h1>
          <p className="text-xs text-slate-400 mt-1">Sistem Operasional & Pemeliharaan Gedung RMH</p>
        </div>

        {/* Login Form */}
        <div className="p-8">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
              <span className="font-semibold text-rose-800">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all"
                  placeholder="Masukkan username Anda"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-slate-900 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-950 focus:ring-4 focus:ring-slate-900/20 active:scale-[0.99] transition-all disabled:opacity-70 flex justify-center items-center text-sm shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk ke Portal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              ⚡ Akun Demo (1-Click Login)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => quickFill("budi", "ob123")}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900">OB Budi</span>
                <span className="text-[10px] text-slate-500">Pelaksana</span>
              </button>
              <button
                type="button"
                onClick={() => quickFill("supervisor", "spv123")}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900">Hendra</span>
                <span className="text-[10px] text-slate-500">Supervisor</span>
              </button>
              <button
                type="button"
                onClick={() => quickFill("admin", "admin123")}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900">Admin</span>
                <span className="text-[10px] text-slate-500">Pengelola</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-3.5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Gedung RMH &bull; Sistem Pemeliharaan Fasilitas Internal v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
