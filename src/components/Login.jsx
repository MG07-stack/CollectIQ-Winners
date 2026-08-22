import React, { useState } from "react";
import { LogIn } from "lucide-react";
import { INK, PANEL, BORDER, CANVAS, TEXT, SUBTLE, PRIMARY, HIGH, HIGH_SOFT, SERIF } from "../theme.js";
import { login } from "../api.js";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await login(username.trim(), password);
      onLogin(token, user);
    } catch (err) {
      setError(err.message || "Couldn't sign in. Check your username and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: INK }}>
      <div className="w-full max-w-sm rounded-xl p-7 flex flex-col gap-5" style={{ backgroundColor: PANEL }}>
        <div className="flex flex-col items-center gap-2 mb-1">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-semibold" style={{ backgroundColor: PRIMARY, color: "white", fontFamily: SERIF }}>
            C
          </div>
          <h1 className="text-xl font-semibold" style={{ color: TEXT, fontFamily: SERIF }}>Sign in to CollectIQ</h1>
          <p className="text-xs" style={{ color: SUBTLE }}>Collections dashboard for your team</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: SUBTLE }}>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full text-sm rounded-lg px-3 py-2 outline-none"
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
              className="w-full text-sm rounded-lg px-3 py-2 outline-none"
              style={{ border: `1px solid ${BORDER}`, backgroundColor: CANVAS, color: TEXT }}
            />
          </div>

          {error && (
            <div className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: HIGH_SOFT, color: HIGH }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: PRIMARY }}
          >
            <LogIn size={15} /> {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="text-xs rounded-lg px-3 py-2 leading-relaxed" style={{ backgroundColor: CANVAS, color: SUBTLE }}>
          Demo accounts — <b>admin / admin123</b>, <b>agent1 / agent123</b>, <b>agent2 / agent123</b>.
        </div>
      </div>
    </div>
  );
}
