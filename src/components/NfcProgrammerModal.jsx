import React, { useState } from "react";
import {
  Wifi,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  HelpCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";
import {
  PANEL,
  BORDER,
  CANVAS,
  TEXT,
  SUBTLE,
  PRIMARY,
  PRIMARY_SOFT,
  MONO,
  SERIF,
} from "../theme.js";
import { CUSTOMERS_LIST } from "../mockData.js";

export default function NfcProgrammerModal({ isOpen, onClose, onSimulateTap }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState("CUST001");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://collectiq.app";
  const targetUrl = `${currentOrigin}/customer/${selectedCustomerId}`;
  const selectedCustomer = CUSTOMERS_LIST.find((c) => c.id === selectedCustomerId) || CUSTOMERS_LIST[0];

  function handleCopy() {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleTestDirect() {
    onSimulateTap(selectedCustomerId);
    onClose();
  }

  function handleTestInvalid() {
    onSimulateTap("INVALID999");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in"
      style={{ backgroundColor: "rgba(18,23,43,0.65)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: PANEL }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: PRIMARY }}
            >
              <Wifi size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold" style={{ color: TEXT, fontFamily: SERIF }}>
                NFC Card Guide & Programmer
              </h2>
              <p className="text-xs" style={{ color: SUBTLE }}>
                NFC cards store only the customer URL/ID.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 text-gray-400 hover:text-gray-700 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Customer Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: TEXT }}>
            1. Select Customer for NFC Card
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-xl px-3 py-2.5 outline-none border cursor-pointer font-medium"
            style={{ backgroundColor: CANVAS, borderColor: BORDER, color: TEXT }}
          >
            {CUSTOMERS_LIST.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.id}] {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* NFC URL Output Box */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold flex items-center justify-between" style={{ color: TEXT }}>
            <span>2. Program this URL onto NFC Card</span>
            <span className="text-[11px] font-normal" style={{ color: SUBTLE }}>NTAG213 / NTAG215 / NTAG216</span>
          </label>

          <div
            className="rounded-xl p-3 flex items-center justify-between gap-2 border"
            style={{ backgroundColor: CANVAS, borderColor: BORDER }}
          >
            <span
              className="font-mono text-xs sm:text-sm font-medium truncate select-all"
              style={{ color: TEXT }}
            >
              {targetUrl}
            </span>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all active:scale-95 shrink-0 bg-white"
              style={{ borderColor: BORDER, color: PRIMARY }}
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Quick Test Simulator Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <label className="text-xs font-semibold" style={{ color: TEXT }}>
            3. Instant Demo Simulator (No physical card required)
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleTestDirect}
              className="w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
              style={{ backgroundColor: PRIMARY }}
            >
              <Zap size={15} />
              <span>Simulate NFC Tap: {selectedCustomer.name.split(" ")[0]}</span>
            </button>

            <button
              onClick={handleTestInvalid}
              className="w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-black/5 cursor-pointer"
              style={{ borderColor: BORDER, color: TEXT }}
            >
              <AlertTriangle size={15} className="text-amber-600" />
              <span>Test Invalid NFC Tag</span>
            </button>
          </div>
        </div>

        {/* How to write physical NFC card Instructions */}
        <div
          className="rounded-xl p-3.5 flex flex-col gap-2 border text-xs leading-relaxed"
          style={{ backgroundColor: PRIMARY_SOFT, borderColor: "#C8E4D6", color: "#1D5239" }}
        >
          <div className="font-bold flex items-center gap-1.5 text-xs sm:text-sm">
            <Smartphone size={15} /> How to write to a physical NFC card:
          </div>
          <ol className="list-decimal pl-4 space-y-1 text-[11px] sm:text-xs">
            <li>Install <strong>NFC Tools</strong> app (free on iOS & Android).</li>
            <li>Select <strong>Write</strong> → <strong>Add a record</strong> → <strong>Custom URL / URI</strong>.</li>
            <li>Paste the URL: <code className="font-mono bg-white/70 px-1 py-0.5 rounded text-[10px]">{targetUrl}</code>.</li>
            <li>Tap <strong>Write</strong> and touch your blank NFC card to the back of your phone.</li>
            <li>Done! Whenever any phone taps the card, it automatically opens CollectIQ and logs the visit.</li>
          </ol>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-medium border"
          style={{ borderColor: BORDER, color: SUBTLE }}
        >
          Close Guide
        </button>
      </div>
    </div>
  );
}
