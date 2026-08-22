"use client";

import React, { useState } from "react";
import { Sparkles, X, Mail, Lock, User, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export default function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const { login, register, loginWithGoogle, authError, clearError, isLoading } = useAuth();

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTabChange = (newMode: "login" | "register") => {
    setMode(newMode);
    clearError();
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError("Please fill in all required fields");
      return;
    }

    if (mode === "register") {
      if (password.length < 8) {
        setLocalError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        setLocalError("Passwords do not match");
        return;
      }
      try {
        await register(name, email, password);
        onClose();
      } catch {
        // Handled by AuthContext
      }
    } else {
      try {
        await login(email, password);
        onClose();
      } catch {
        // Handled by AuthContext
      }
    }
  };

  const activeError = localError || authError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0e141c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#00dce5]/10 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00dce5]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#d1bcff]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00dce5] to-[#d1bcff] flex items-center justify-center shadow-lg shadow-[#00dce5]/20">
              <Sparkles className="w-5 h-5 text-[#0b0f14]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">FinTwin Account</h2>
              <p className="text-[11px] text-white/50">Personal Financial Digital Twin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 my-5 bg-white/5 rounded-2xl border border-white/5 relative z-10">
          <button
            onClick={() => handleTabChange("login")}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              mode === "login"
                ? "bg-[#00dce5] text-[#0b0f14] shadow-md shadow-[#00dce5]/20"
                : "text-white/60 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => handleTabChange("register")}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              mode === "register"
                ? "bg-[#00dce5] text-[#0b0f14] shadow-md shadow-[#00dce5]/20"
                : "text-white/60 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Banner */}
        {activeError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-400 text-xs relative z-10 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{activeError}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="relative z-10 mb-5">
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition cursor-pointer shadow-sm group"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span className="group-hover:text-[#00dce5] transition">Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] uppercase font-mono text-white/40 tracking-wider">or with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 relative z-10">
          {mode === "register" && (
            <div>
              <label className="block text-[11px] font-bold text-white/70 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Arjun Kumar"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#00dce5] transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-white/70 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#00dce5] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/70 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#00dce5] transition"
              />
            </div>
            {mode === "register" && (
              <span className="text-[10px] text-white/40 block mt-1">Minimum 8 characters</span>
            )}
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-[11px] font-bold text-white/70 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#00dce5] transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-5 py-3 px-4 rounded-2xl bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-[#00dce5]/20"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
