import React, { useState } from "react";
import {
  LogIn,
  UserPlus,
  UserCheck,
  ShieldCheck,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  INK,
  PANEL,
  BORDER,
  CANVAS,
  TEXT,
  SUBTLE,
  PRIMARY,
  PRIMARY_SOFT,
  HIGH,
  HIGH_SOFT,
  SERIF,
} from "../theme.js";
import { login, register } from "../api.js";
import { COMPANIES_LIST } from "../mockData.js";

export default function Login({ onLogin, initialMode = "signin" }) {
  const [isRegistering, setIsRegistering] = useState(initialMode === "register");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Field Agent");
  const [rememberMe, setRememberMe] = useState(true);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validateEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function validateForm() {
    const errs = {};
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      errs.email = "Email address is required.";
    } else if (!validateEmail(cleanEmail)) {
      errs.email = "Please enter a valid email address (e.g. user@example.com).";
    }

    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }

    if (isRegistering) {
      if (!fullName.trim()) {
        errs.fullName = "Full name is required.";
      }
      if (!confirmPassword) {
        errs.confirmPassword = "Please confirm your password.";
      } else if (password !== confirmPassword) {
        errs.confirmPassword = "Passwords do not match.";
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        const { token, user } = await register(
          email.trim().toLowerCase(),
          password,
          fullName.trim(),
          role
        );
        onLogin(token, user, rememberMe);
      } else {
        const { token, user } = await login(email.trim().toLowerCase(), password);
        onLogin(token, user, rememberMe);
      }
    } catch (err) {
      const msg = err.message || (isRegistering ? "Registration failed." : "Sign in failed.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(demoEmail, demoPassword) {
    setIsRegistering(false);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
    setFieldErrors({});
  }

  function switchMode(registerMode) {
    setIsRegistering(registerMode);
    setError("");
    setFieldErrors({});
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: INK, fontFamily: "'Inter', sans-serif" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-2xl border"
        style={{ backgroundColor: PANEL, borderColor: "rgba(255,255,255,0.08)" }}
      >
        {/* Brand Header */}
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
          <p className="text-xs mt-0.5" style={{ color: SUBTLE }}>
            Enterprise Collections & Field Audit Platform
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div
          className="flex p-1 rounded-xl"
          style={{ backgroundColor: CANVAS, border: `1px solid ${BORDER}` }}
        >
          <button
            type="button"
            onClick={() => switchMode(false)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !isRegistering
                ? "bg-white shadow-xs text-emerald-950 font-bold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode(true)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isRegistering
                ? "bg-white shadow-xs text-emerald-950 font-bold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            className="text-xs rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in"
            style={{ backgroundColor: HIGH_SOFT, color: HIGH, border: "1px solid #F2B8B5" }}
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {isRegistering && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: TEXT }}>
                Full Name
              </label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: SUBTLE }}
                />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: "" });
                  }}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs sm:text-sm rounded-xl pl-9 pr-3 py-2.5 outline-none transition-shadow focus:ring-2 focus:ring-emerald-500/20"
                  style={{
                    border: `1px solid ${fieldErrors.fullName ? HIGH : BORDER}`,
                    backgroundColor: CANVAS,
                    color: TEXT,
                  }}
                  autoFocus
                />
              </div>
              {fieldErrors.fullName && (
                <span className="text-[11px] font-medium" style={{ color: HIGH }}>
                  {fieldErrors.fullName}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: TEXT }}>
              Email Address
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: SUBTLE }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                }}
                placeholder="name@company.com"
                className="w-full text-xs sm:text-sm rounded-xl pl-9 pr-3 py-2.5 outline-none transition-shadow focus:ring-2 focus:ring-emerald-500/20"
                style={{
                  border: `1px solid ${fieldErrors.email ? HIGH : BORDER}`,
                  backgroundColor: CANVAS,
                  color: TEXT,
                }}
                autoFocus={!isRegistering}
              />
            </div>
            {fieldErrors.email && (
              <span className="text-[11px] font-medium" style={{ color: HIGH }}>
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: TEXT }}>
              Password
            </label>
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: SUBTLE }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
                }}
                placeholder="••••••••"
                className="w-full text-xs sm:text-sm rounded-xl pl-9 pr-3 py-2.5 outline-none transition-shadow focus:ring-2 focus:ring-emerald-500/20"
                style={{
                  border: `1px solid ${fieldErrors.password ? HIGH : BORDER}`,
                  backgroundColor: CANVAS,
                  color: TEXT,
                }}
              />
            </div>
            {fieldErrors.password && (
              <span className="text-[11px] font-medium" style={{ color: HIGH }}>
                {fieldErrors.password}
              </span>
            )}
          </div>

          {isRegistering && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: TEXT }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: SUBTLE }}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword)
                        setFieldErrors({ ...fieldErrors, confirmPassword: "" });
                    }}
                    placeholder="••••••••"
                    className="w-full text-xs sm:text-sm rounded-xl pl-9 pr-3 py-2.5 outline-none transition-shadow focus:ring-2 focus:ring-emerald-500/20"
                    style={{
                      border: `1px solid ${fieldErrors.confirmPassword ? HIGH : BORDER}`,
                      backgroundColor: CANVAS,
                      color: TEXT,
                    }}
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <span className="text-[11px] font-medium" style={{ color: HIGH }}>
                    {fieldErrors.confirmPassword}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: TEXT }}>
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl px-3 py-2.5 outline-none cursor-pointer border font-medium"
                  style={{ borderColor: BORDER, backgroundColor: CANVAS, color: TEXT }}
                >
                  <option value="Field Agent">Field Agent</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </>
          )}

          {!isRegistering && (
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs" style={{ color: SUBTLE }}>
                  Remember me
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1.5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all active:scale-[0.99] shadow-sm cursor-pointer"
            style={{ backgroundColor: PRIMARY }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{isRegistering ? "Creating Account..." : "Signing In..."}</span>
              </>
            ) : (
              <>
                {isRegistering ? <UserPlus size={16} /> : <LogIn size={16} />}
                <span>{isRegistering ? "Create Account & Sign In" : "Sign In to CollectIQ"}</span>
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Accounts */}
        {!isRegistering && (
          <div
            className="flex flex-col gap-2.5 pt-3 border-t"
            style={{ borderColor: BORDER }}
          >
            <span
              className="text-[11px] font-semibold uppercase tracking-wider text-center"
              style={{ color: SUBTLE }}
            >
              1-Click Demo Accounts (Wholesalers & Retailers)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => fillDemo("admin@collectiq.com", "admin123")}
                className="text-[11px] font-medium py-2 px-2.5 rounded-xl border transition-all hover:bg-black/5 flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ borderColor: BORDER, color: TEXT, backgroundColor: CANVAS }}
              >
                <ShieldCheck size={13} style={{ color: PRIMARY }} />
                <span>Admin (Full Network)</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("apex@collectiq.com", "admin123")}
                className="text-[11px] font-medium py-2 px-2.5 rounded-xl border transition-all hover:bg-black/5 flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ borderColor: BORDER, color: TEXT, backgroundColor: CANVAS }}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Apex FMCG (Wholesaler)</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("guptakirana@collectiq.com", "admin123")}
                className="text-[11px] font-medium py-2 px-2.5 rounded-xl border transition-all hover:bg-black/5 flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ borderColor: BORDER, color: TEXT, backgroundColor: CANVAS }}
              >
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Gupta Kirana (Retailer)</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("bharat@collectiq.com", "admin123")}
                className="text-[11px] font-medium py-2 px-2.5 rounded-xl border transition-all hover:bg-black/5 flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ borderColor: BORDER, color: TEXT, backgroundColor: CANVAS }}
              >
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>Bharat Digital (Distributor)</span>
              </button>
            </div>

            {/* Quick Switcher for all 20 Companies */}
            <div className="flex flex-col gap-1 mt-1">
              <label className="text-[10px] font-semibold text-gray-500">
                Or select any of the 20 Indian businesses:
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    fillDemo(e.target.value, "admin123");
                  }
                }}
                defaultValue=""
                className="text-xs rounded-xl p-2 outline-none cursor-pointer border"
                style={{ backgroundColor: CANVAS, borderColor: BORDER, color: TEXT }}
              >
                <option value="" disabled>
                  Choose a company to test (1-20)...
                </option>
                {COMPANIES_LIST.map((c) => (
                  <option key={c.id} value={c.email}>
                    {c.name} ({c.type} • {c.scale})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
