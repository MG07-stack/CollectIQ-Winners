import React, { useState } from "react";
import { LogIn, UserPlus, UserCheck, ShieldCheck, User } from "lucide-react";
import { INK, PANEL, BORDER, CANVAS, TEXT, SUBTLE, PRIMARY, HIGH, HIGH_SOFT, SERIF } from "../theme.js";
import { login, register } from "../api.js";

export default function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Field Agent");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter a username and password.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        const { token, user } = await register(username.trim(), password, name.trim(), role);
        onLogin(token, user);
      } else {
        const { token, user } = await login(username.trim(), password);
        onLogin(token, user);
      }
    } catch (err) {
      setError(err.message || (isRegistering ? "Registration failed." : "Sign in failed. Check your credentials."));
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(u, p) {
    setIsRegistering(false);
    setUsername(u);
    setPassword(p);
    setError("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: INK }}>
      <div className="w-full max-w-sm rounded-xl p-6 sm:p-8 flex flex-col gap-5 shadow-2xl" style={{ backgroundColor: PANEL }}>
        <div className="flex flex-col items-center gap-2 text-center">
          <img
            src="/logo-icon.png"
            alt="CollectIQ Icon"
            className="w-12 h-12 rounded-xl object-contain shadow-md mb-0.5"
          />
          <img
            src="/logo-full.png"
            alt="CollectIQ"
            className="h-7 object-contain max-w-[150px]"
          />
          <p className="text-xs mt-0.5" style={{ color: SUBTLE }}>Collections & Field Audit Dashboard</p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex p-1 rounded-lg" style={{ backgroundColor: CANVAS }}>
          <button
            type="button"
            onClick={() => { setIsRegistering(false); setError(""); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${!isRegistering ? "bg-white shadow text-emerald-900" : "text-gray-500 hover:text-gray-900"
              }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegistering(true); setError(""); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${isRegistering ? "bg-white shadow text-emerald-900" : "text-gray-500 hover:text-gray-900"
              }`}
          >
            Register New User
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {isRegistering && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: SUBTLE }}>Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full text-xs sm:text-sm rounded-lg px-3 py-2 outline-none transition-shadow focus:ring-2 focus:ring-emerald-500/20"
                style={{ border: `1px solid ${BORDER}`, backgroundColor: CANVAS, color: TEXT }}
                autoFocus
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: SUBTLE }}>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ramesh"
              className="w-full text-xs sm:text-sm rounded-lg px-3 py-2 outline-none transition-shadow focus:ring-2 focus:ring-emerald-500/20"
              style={{ border: `1px solid ${BORDER}`, backgroundColor: CANVAS, color: TEXT }}
              autoFocus={!isRegistering}
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

          {isRegistering && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: SUBTLE }}>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-lg px-2.5 py-2 outline-none cursor-pointer"
                style={{ border: `1px solid ${BORDER}`, backgroundColor: CANVAS, color: TEXT }}
              >
                <option value="Field Agent">Field Agent</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          )}

          {error && (
            <div className="text-xs rounded-lg px-3 py-2 leading-snug" style={{ backgroundColor: HIGH_SOFT, color: HIGH }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity active:opacity-90 shadow-sm cursor-pointer"
            style={{ backgroundColor: PRIMARY }}
          >
            {isRegistering ? <UserPlus size={15} /> : <LogIn size={15} />}
            {loading ? "Processing..." : isRegistering ? "Create Account & Sign In" : "Sign In"}
          </button>
        </form>

        {!isRegistering && (
          <div className="flex flex-col gap-2 pt-3 border-t" style={{ borderColor: BORDER }}>
            <span className="text-[11px] font-medium uppercase tracking-wide text-center" style={{ color: SUBTLE }}>
              Quick 1-Click Demo Accounts
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => fillDemo("admin", "admin123")}
                className="text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-colors hover:bg-black/5 flex items-center justify-center gap-1 cursor-pointer"
                style={{ borderColor: BORDER, color: TEXT }}
              >
                <ShieldCheck size={12} style={{ color: PRIMARY }} /> Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo("agent1", "agent123")}
                className="text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-colors hover:bg-black/5 flex items-center justify-center gap-1 cursor-pointer"
                style={{ borderColor: BORDER, color: TEXT }}
              >
                <UserCheck size={12} style={{ color: PRIMARY }} /> Agent 1
              </button>
              <button
                type="button"
                onClick={() => fillDemo("agent2", "agent123")}
                className="text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-colors hover:bg-black/5 flex items-center justify-center gap-1 cursor-pointer"
                style={{ borderColor: BORDER, color: TEXT }}
              >
                <UserCheck size={12} style={{ color: PRIMARY }} /> Agent 2
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
