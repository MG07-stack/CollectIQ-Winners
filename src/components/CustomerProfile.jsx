import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  FileText,
  CreditCard,
  Phone,
  MapPin,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  Wifi,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import {
  PANEL,
  BORDER,
  CANVAS,
  TEXT,
  SUBTLE,
  PRIMARY,
  PRIMARY_SOFT,
  HIGH,
  HIGH_SOFT,
  MED,
  MED_SOFT,
  MONO,
  SERIF,
  money,
} from "../theme.js";
import { getCustomerById, recordCustomerVisit } from "../api.js";
import PriorityBadge from "./PriorityBadge.jsx";
import StatusPill from "./StatusPill.jsx";

export default function CustomerProfile({
  customerId,
  token,
  user,
  onBack,
  onVisitLogged,
}) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [customerError, setCustomerError] = useState("");

  const [visitRecorded, setVisitRecorded] = useState(false);
  const [visitTime, setVisitTime] = useState(null);
  const [visitError, setVisitError] = useState("");
  const [recordingVisit, setRecordingVisit] = useState(false);

  const [showInvoices, setShowInvoices] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState("");

  // Ref to prevent multiple API visit triggers on fast re-renders
  const visitTriggeredRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      setLoading(true);
      setNotFound(false);
      setCustomerError("");

      try {
        const data = await getCustomerById(token, customerId);
        if (!isMounted) return;

        setCustomer(data);

        // Trigger visit recording once per page mount/tap
        if (!visitTriggeredRef.current) {
          visitTriggeredRef.current = true;
          triggerVisitRecording(data);
        }
      } catch (err) {
        if (!isMounted) return;
        const msg = err.message || "";
        if (msg.includes("Customer Not Found") || msg.includes("not linked") || msg.includes("404")) {
          setNotFound(true);
        } else {
          setCustomerError(msg || "Failed to load customer profile.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [customerId, token]);

  async function triggerVisitRecording(custData) {
    setRecordingVisit(true);
    setVisitError("");
    try {
      const res = await recordCustomerVisit(token, customerId, {
        customer: custData.name,
        outcome: "NFC Tap Check-in",
        notes: "Customer identified via physical NFC card tap.",
        agent: user?.name || user?.username || "Field Agent",
      });

      setVisitRecorded(true);
      const timeString = res.visit_time
        ? formatDateTime(res.visit_time)
        : formatDateTime(new Date().toISOString());
      setVisitTime(timeString);

      if (onVisitLogged) {
        onVisitLogged(res.visit || res);
      }
    } catch (err) {
      console.error("Visit recording error:", err);
      setVisitError("Visit could not be recorded. Please try again.");
    } finally {
      setRecordingVisit(false);
    }
  }

  async function handleRetryVisit() {
    if (!customer) return;
    await triggerVisitRecording(customer);
  }

  async function handleRecordPayment(e) {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) return;

    setPaymentSubmitting(true);
    try {
      const topInvoice = customer.invoices?.find((i) => i.status !== "Paid");
      const res = await recordCustomerVisit(token, customerId, {
        customer: customer.name,
        invoiceId: topInvoice?.id,
        outcome: "Collected Cash",
        amount: Number(paymentAmount),
        notes: paymentNotes || `Collected cash payment at customer premises: ₹${paymentAmount}`,
        agent: user?.name || user?.username || "Field Agent",
      });

      setPaymentSuccess(`✓ Payment of ₹${Number(paymentAmount).toLocaleString("en-IN")} recorded successfully!`);
      setPaymentAmount("");
      setPaymentNotes("");

      // Refresh customer data
      const updated = await getCustomerById(token, customerId);
      setCustomer(updated);

      if (onVisitLogged) {
        onVisitLogged(res.visit || res);
      }

      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentSuccess("");
      }, 2000);
    } catch (err) {
      setVisitError(err.message || "Failed to record payment.");
    } finally {
      setPaymentSubmitting(false);
    }
  }

  function formatDateTime(isoString) {
    if (!isoString) return "Just now";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  }

  // Invalid Customer UI
  if (notFound) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6"
        style={{ backgroundColor: CANVAS, fontFamily: "'Inter', sans-serif" }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-lg animate-in fade-in"
          style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: HIGH_SOFT, color: HIGH }}
          >
            <AlertTriangle size={32} />
          </div>

          <h2
            className="text-xl sm:text-2xl font-bold mb-2"
            style={{ color: TEXT, fontFamily: SERIF }}
          >
            Customer Not Found
          </h2>

          <p className="text-xs sm:text-sm mb-4 leading-relaxed" style={{ color: SUBTLE }}>
            The NFC card is not linked to a valid CollectIQ customer.
          </p>

          <div
            className="w-full p-3.5 rounded-xl text-left text-xs mb-6"
            style={{ backgroundColor: CANVAS, border: `1px solid ${BORDER}` }}
          >
            <div className="font-semibold text-gray-700 mb-1">NFC Tag Details:</div>
            <div className="text-gray-600 font-mono text-[11px] mb-2">Target ID: {customerId}</div>
            <div className="text-gray-500 text-[11px]">
              Tip: Program the NFC card with a valid customer ID such as <strong>CUST001</strong> (Sharma Traders) or <strong>CUST002</strong> (Tata Consultancy Services).
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm cursor-pointer"
            style={{ backgroundColor: PRIMARY }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center p-6 gap-3"
        style={{ backgroundColor: CANVAS }}
      >
        <div className="w-10 h-10 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs sm:text-sm font-medium" style={{ color: SUBTLE }}>
          Identifying customer & recording NFC tap...
        </span>
      </div>
    );
  }

  // General error state
  if (customerError || !customer) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center p-4"
        style={{ backgroundColor: CANVAS }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-6 text-center shadow-lg"
          style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
        >
          <AlertCircle size={36} className="mx-auto mb-3 text-red-600" />
          <h3 className="text-lg font-semibold mb-2" style={{ color: TEXT }}>
            Unable to Load Customer
          </h3>
          <p className="text-xs sm:text-sm mb-5" style={{ color: SUBTLE }}>
            {customerError || "An unexpected error occurred while fetching customer details."}
          </p>
          <button
            onClick={onBack}
            className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white"
            style={{ backgroundColor: PRIMARY }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const lastVisitDisplay = visitTime || (customer.lastVisit ? formatDateTime(customer.lastVisit) : "22 Aug 2026, 10:30 PM");

  return (
    <div
      className="min-h-screen w-full py-4 sm:py-8 px-3.5 sm:px-6 flex justify-center"
      style={{ backgroundColor: CANVAS, fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-2xl flex flex-col gap-4 sm:gap-5">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl transition-colors hover:bg-black/5 active:scale-95 cursor-pointer"
            style={{ color: TEXT }}
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full border"
            style={{ borderColor: BORDER, backgroundColor: PANEL, color: SUBTLE }}>
            <Wifi size={12} className="text-emerald-700" />
            <span>NFC Tap Verified</span>
          </div>
        </div>

        {/* Visit Recording Status Banner */}
        {visitRecorded && (
          <div
            className="w-full rounded-2xl p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 shadow-sm border animate-in slide-in-from-top-2 duration-300"
            style={{ backgroundColor: "#EBF5F0", borderColor: "#C8E4D6", color: "#1D5239" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold flex items-center gap-1.5">
                  ✓ Visit Recorded
                </div>
                <div className="text-[11px] sm:text-xs text-emerald-800/80 mt-0.5">
                  Audit check-in logged for <strong>{customer.name}</strong> • {visitTime || "Just now"}
                </div>
              </div>
            </div>

            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-700 text-white">
              Success
            </span>
          </div>
        )}

        {/* Error Recording Visit Banner */}
        {visitError && (
          <div
            className="w-full rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm border animate-in slide-in-from-top-2"
            style={{ backgroundColor: HIGH_SOFT, borderColor: "#F2CCC7", color: HIGH }}
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} className="shrink-0" />
              <div>
                <div className="text-xs sm:text-sm font-bold">⚠ Visit could not be recorded</div>
                <div className="text-[11px] text-red-700/80">Please try again.</div>
              </div>
            </div>

            <button
              onClick={handleRetryVisit}
              disabled={recordingVisit}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm shrink-0"
            >
              <RefreshCw size={12} className={recordingVisit ? "animate-spin" : ""} />
              {recordingVisit ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        {/* Customer Main Profile Card */}
        <div
          className="rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-5 border"
          style={{ backgroundColor: PANEL, borderColor: BORDER }}
        >
          {/* Header row with customer name and avatar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-bold text-base sm:text-lg shrink-0 shadow-sm"
                style={{ backgroundColor: PRIMARY_SOFT, color: PRIMARY }}
              >
                {customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    className="text-lg sm:text-2xl font-bold tracking-tight"
                    style={{ color: TEXT, fontFamily: SERIF }}
                  >
                    {customer.name}
                  </h1>
                  <span
                    className="text-[11px] sm:text-xs font-mono font-semibold px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: CANVAS, color: SUBTLE, border: `1px solid ${BORDER}` }}
                  >
                    {customer.id}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs mt-1" style={{ color: SUBTLE }}>
                  <span className="flex items-center gap-1 truncate">
                    <MapPin size={12} /> {customer.address || "Gurugram, Haryana"}
                  </span>
                  {customer.phone && (
                    <span className="hidden sm:flex items-center gap-1">
                      <Phone size={12} /> {customer.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs" style={{ color: SUBTLE }}>
              <div className="flex items-center gap-1">
                <User size={13} />
                <span>Assigned: <strong>{customer.agent || user?.name || "agent1"}</strong></span>
              </div>
              <span className="text-[11px] text-emerald-800 font-medium">NFC Tag Active</span>
            </div>
          </div>

          {/* Key Metrics Grid: Outstanding, Overdue, Last Visit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Outstanding Card */}
            <div
              className="rounded-xl p-3.5 sm:p-4 flex flex-col justify-between border shadow-xs"
              style={{ backgroundColor: CANVAS, borderColor: BORDER }}
            >
              <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider" style={{ color: SUBTLE }}>
                Outstanding
              </span>
              <div
                className="text-xl sm:text-2xl font-bold mt-1 tabular-nums"
                style={{ color: TEXT, fontFamily: MONO }}
              >
                {money(customer.outstanding)}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-1" style={{ color: SUBTLE }}>
                {customer.invoices?.filter((i) => i.status !== "Paid").length || 0} open invoices
              </span>
            </div>

            {/* Overdue Card */}
            <div
              className="rounded-xl p-3.5 sm:p-4 flex flex-col justify-between border shadow-xs"
              style={{ backgroundColor: HIGH_SOFT, borderColor: "#F2CCC7" }}
            >
              <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider" style={{ color: HIGH }}>
                Overdue
              </span>
              <div
                className="text-xl sm:text-2xl font-bold mt-1 tabular-nums"
                style={{ color: HIGH, fontFamily: MONO }}
              >
                {money(customer.overdue)}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-1" style={{ color: HIGH }}>
                {customer.overdue > 0 ? "Requires urgent follow-up" : "All current"}
              </span>
            </div>

            {/* Last Visit Card */}
            <div
              className="rounded-xl p-3.5 sm:p-4 flex flex-col justify-between border shadow-xs"
              style={{ backgroundColor: CANVAS, borderColor: BORDER }}
            >
              <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider" style={{ color: SUBTLE }}>
                Last Visit
              </span>
              <div
                className="text-xs sm:text-sm font-semibold mt-1.5 leading-snug"
                style={{ color: TEXT }}
              >
                {lastVisitDisplay}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-1 flex items-center gap-1" style={{ color: PRIMARY }}>
                <ShieldCheck size={12} /> Auto-logged via NFC
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setShowInvoices(!showInvoices)}
              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border transition-all active:scale-98 shadow-xs cursor-pointer"
              style={{ borderColor: BORDER, backgroundColor: CANVAS, color: TEXT }}
            >
              <FileText size={16} style={{ color: PRIMARY }} />
              <span>{showInvoices ? "Hide Invoices" : "View Invoices"}</span>
              {showInvoices ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm cursor-pointer"
              style={{ backgroundColor: PRIMARY }}
            >
              <CreditCard size={16} />
              <span>Record Payment</span>
            </button>
          </div>

          {/* Collapsible Invoices Section */}
          {showInvoices && (
            <div className="flex flex-col gap-2.5 pt-3 border-t animate-in fade-in" style={{ borderColor: BORDER }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold" style={{ color: TEXT }}>
                  Invoices for {customer.name}
                </h3>
                <span className="text-xs" style={{ color: SUBTLE }}>
                  {customer.invoices?.length || 0} total
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {customer.invoices && customer.invoices.length > 0 ? (
                  customer.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="rounded-xl p-3 flex items-center justify-between gap-3 border"
                      style={{ backgroundColor: CANVAS, borderColor: BORDER }}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold" style={{ color: TEXT }}>
                            {inv.id}
                          </span>
                          <StatusPill status={inv.status} />
                          <PriorityBadge level={inv.priority} />
                        </div>
                        <span className="text-[11px]" style={{ color: SUBTLE }}>
                          Due: {inv.due} {inv.daysOverdue > 0 && `(${inv.daysOverdue}d overdue)`}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs sm:text-sm font-bold tabular-nums" style={{ color: TEXT }}>
                          {money(inv.amount)}
                        </div>
                        <span className="text-[10px]" style={{ color: SUBTLE }}>
                          Issued: {inv.issued}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-center py-4" style={{ color: SUBTLE }}>
                    No invoices on record for this customer.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Back to Dashboard Banner */}
        <div className="flex justify-center pb-6">
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors hover:bg-black/5 active:scale-95 cursor-pointer"
            style={{ borderColor: BORDER, color: SUBTLE, backgroundColor: PANEL }}
          >
            ← Back to Dashboard Overview
          </button>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in"
          style={{ backgroundColor: "rgba(18,23,43,0.6)" }}
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95"
            style={{ backgroundColor: PANEL }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: BORDER }}>
              <div>
                <h3 className="text-base sm:text-lg font-bold" style={{ color: TEXT }}>
                  Record Payment
                </h3>
                <p className="text-xs" style={{ color: SUBTLE }}>
                  Collecting cash / cheque for {customer.name}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-lg hover:bg-black/5 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {paymentSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold text-center">
                {paymentSuccess}
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: SUBTLE }}>
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 12000"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm font-semibold outline-none border focus:border-emerald-700"
                      style={{ backgroundColor: CANVAS, borderColor: BORDER, color: TEXT }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-500">
                    Outstanding balance: {money(customer.outstanding)}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: SUBTLE }}>
                    Payment Notes / Reference
                  </label>
                  <textarea
                    rows={2}
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Cash collected on-site, Cheque #1234..."
                    className="w-full p-2.5 rounded-xl text-xs sm:text-sm outline-none border resize-none focus:border-emerald-700"
                    style={{ backgroundColor: CANVAS, borderColor: BORDER, color: TEXT }}
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border"
                    style={{ borderColor: BORDER, color: SUBTLE }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paymentSubmitting}
                    className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-opacity active:opacity-90 shadow-sm"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {paymentSubmitting ? "Saving..." : "Confirm & Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
