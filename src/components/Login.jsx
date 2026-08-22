import React, { useState } from "react";
import { LogIn, UserCheck, ShieldCheck } from "lucide-react";
import { INK, PANEL, BORDER, CANVAS, TEXT, SUBTLE, PRIMARY, HIGH, HIGH_SOFT, SERIF } from "../theme.js";
import { login } from "../api.js";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!username || !password) {
      setError("Please enter a username and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { token, user } = await login(username.trim(), password);
      onLogin(token, user);
    } catch (err) {
      setError(err.message || "Sign in failed. Check your username and password.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(u, p) {
    setUsername(u);
    setPassword(p);
    setError("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: INK }}>
      <div className="w-full max-w-sm rounded-xl p-6 sm:p-8 flex flex-col gap-5 shadow-2xl" style={{ backgroundColor: PANEL }}>
        <div className="flex flex-col items-center gap-2 mb-1 text-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-base shadow-sm" style={{ backgroundColor: PRIMARY, color: "white", fontFamily: SERIF }}>
            C
          </div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: TEXT, fontFamily: SERIF }}>Sign in to CollectIQ</h1>
          <p className="text-xs" style={{ color: SUBTLE }}>Collections & Field Audit Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: SUBTLE }}>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              className="w-full text-xs sm:text-sm rounded-lg px-3 py-2 outline-none transition-shadow focus:ring-2 focus:ring-emerald-500/20"
              style={{ border: `1px solid ${BORDER}`, backgroundColor: CANVAS, color: TEXT }}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: SUBTLE }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs sm:text-sm rounded-lg px-3 py-2 outline-none transition-shadow focus:ring-2 focus:ring-emerald-500/20"
              style={{ border: `1px solid ${BORDER}`, backgroundColor: CANVAS, color: TEXT }}
            />
          </div>

          {error && (
            <div className="text-xs rounded-lg px-3 py-2 leading-snug" style={{ backgroundColor: HIGH_SOFT, color: HIGH }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity active:opacity-90 shadow-sm"
            style={{ backgroundColor: PRIMARY }}
          >
            <LogIn size={15} /> {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="flex flex-col gap-2 pt-3 border-t" style={{ borderColor: BORDER }}>
          <span className="text-[11px] font-medium uppercase tracking-wide text-center" style={{ color: SUBTLE }}>
            Quick 1-Click Demo Accounts
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => fillDemo("admin", "admin123")}
              className="text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-colors hover:bg-black/5 flex items-center justify-center gap-1"
              style={{ borderColor: BORDER, color: TEXT }}
            >
              <ShieldCheck size={12} style={{ color: PRIMARY }} /> Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo("agent1", "agent123")}
              className="text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-colors hover:bg-black/5 flex items-center justify-center gap-1"
              style={{ borderColor: BORDER, color: TEXT }}
            >
              <UserCheck size={12} style={{ color: PRIMARY }} /> Agent 1
            </button>
            <button
              type="button"
              onClick={() => fillDemo("agent2", "agent123")}
              className="text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-colors hover:bg-black/5 flex items-center justify-center gap-1"
              style={{ borderColor: BORDER, color: TEXT }}
            >
              <UserCheck size={12} style={{ color: PRIMARY }} /> Agent 2
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
