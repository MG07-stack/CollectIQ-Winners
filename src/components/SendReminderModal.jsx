import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  MessageSquare,
  Mail,
  Smartphone,
  QrCode,
  Check,
  Calendar,
  Clock,
  AlertCircle,
  Copy,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  PANEL,
  BORDER,
  TEXT,
  SUBTLE,
  PRIMARY,
  PRIMARY_SOFT,
  HIGH,
  HIGH_SOFT,
  MED,
  MED_SOFT,
  MONO,
  money,
} from "../theme.js";

const TEMPLATES = [
  {
    id: "upcoming",
    name: "Upcoming Payment Reminder",
    tone: "Friendly",
    getText: ({ invoiceId, amount, due, counterparty, seller }) =>
      `Dear ${counterparty},\n\nThis is a friendly reminder from ${seller} regarding Invoice #${invoiceId} for ${money(amount)}, which is due on ${due}.\n\nPlease click here to view invoice details or pay online: https://collectiq.app/pay/${invoiceId}\n\nThank you for your business!`,
  },
  {
    id: "standard",
    name: "Standard Payment Request",
    tone: "Professional",
    getText: ({ invoiceId, amount, due, counterparty, seller }) =>
      `Notice from ${seller}:\n\nPayment for Invoice #${invoiceId} amounting to ${money(amount)} was due on ${due}. We request you to clear the balance at your earliest convenience.\n\nDirect Pay Link: https://collectiq.app/pay/${invoiceId}\n\nFor queries, contact support@collectiq.com.`,
  },
  {
    id: "urgent",
    name: "Urgent Overdue Alert",
    tone: "Firm",
    getText: ({ invoiceId, amount, daysOverdue, counterparty, seller }) =>
      `URGENT NOTICE - ${seller}\n\nInvoice #${invoiceId} for ${money(amount)} is now ${daysOverdue || 15} days OVERDUE.\n\nContinued delay may affect your B2B credit score in the CollectIQ registry. Please settle payment immediately via CollectIQ UPI / Banking Portal: https://collectiq.app/pay/${invoiceId}`,
  },
  {
    id: "custom",
    name: "Custom Payment Note",
    tone: "Custom",
    getText: ({ invoiceId, amount, counterparty, seller }) =>
      `Hi ${counterparty}, kindly process the pending payment of ${money(amount)} for Invoice #${invoiceId} at your earliest convenience. Thank you! - ${seller}`,
  },
];

export default function SendReminderModal({
  isOpen,
  onClose,
  invoice,
  counterparty,
  user,
  onSendReminder,
}) {
  if (!isOpen) return null;

  const targetInvoiceId = invoice?.id || "INV-2026-102";
  const targetAmount = invoice?.amount || 68000;
  const targetCounterparty =
    invoice?.customer || counterparty?.name || "Gupta Kirana & General Store";
  const targetDueDate = invoice?.due || invoice?.dueDate || "2026-08-01";
  const targetDaysOverdue = invoice?.daysOverdue || 22;
  const sellerName =
    user?.full_name || user?.name || "Apex FMCG Wholesalers";

  const defaultPhone =
    counterparty?.phone || invoice?.phone || "+91 98111 22334";
  const defaultEmail =
    counterparty?.email || invoice?.email || "guptakirana@collectiq.com";

  const [channel, setChannel] = useState("WhatsApp");
  const [selectedTemplate, setSelectedTemplate] = useState("urgent");
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState(defaultEmail);
  const [customMessage, setCustomMessage] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("2026-08-25");
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  // Update text when template or target changes
  useEffect(() => {
    const tmpl = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];
    setCustomMessage(
      tmpl.getText({
        invoiceId: targetInvoiceId,
        amount: targetAmount,
        due: targetDueDate,
        daysOverdue: targetDaysOverdue,
        counterparty: targetCounterparty,
        seller: sellerName,
      })
    );
  }, [selectedTemplate, targetInvoiceId, targetAmount, targetDueDate, targetDaysOverdue, targetCounterparty, sellerName]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);

    try {
      const payload = {
        invoiceId: targetInvoiceId,
        amount: targetAmount,
        buyerName: targetCounterparty,
        buyerId: invoice?.buyerId || counterparty?.id || "COMP009",
        sellerId: user?.companyId || user?.id || "COMP001",
        sellerName,
        channel,
        recipientPhone: phone,
        recipientEmail: email,
        template: selectedTemplate,
        message: customMessage,
        isScheduled,
        scheduledFor: isScheduled ? `${scheduleDate}T${scheduleTime}:00` : null,
      };

      if (onSendReminder) {
        await onSendReminder(payload);
      }

      setSuccessToast(
        isScheduled
          ? `Payment reminder scheduled for ${scheduleDate} via ${channel}!`
          : `Payment reminder sent successfully via ${channel}!`
      );

      setTimeout(() => {
        setSuccessToast("");
        onClose();
      }, 1400);
    } catch (err) {
      alert("Failed to dispatch reminder: " + (err.message || err));
    } finally {
      setSending(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      style={{ backgroundColor: "rgba(18, 23, 43, 0.65)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl p-5 sm:p-6 shadow-2xl transition-all duration-200 border flex flex-col gap-4 max-h-[92vh] overflow-y-auto"
        style={{ backgroundColor: PANEL, borderColor: BORDER }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: PRIMARY }}
            >
              <Send size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                Send Payment Reminder
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Notify counterparty of pending bill & payment options
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successToast && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in zoom-in-95">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Invoice Brief Banner */}
        <div
          className="p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3"
          style={{ backgroundColor: "#F8FAF9", borderColor: BORDER }}
        >
          <div>
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">
              Invoice #{targetInvoiceId}
            </span>
            <span className="text-sm font-bold text-gray-900 mt-0.5 block">
              {targetCounterparty}
            </span>
          </div>
          <div className="text-right">
            <span className="text-base font-extrabold text-gray-900" style={{ fontFamily: MONO }}>
              {money(targetAmount)}
            </span>
            <span
              className="inline-block text-[11px] px-2 py-0.5 rounded font-semibold ml-2"
              style={{
                backgroundColor: targetDaysOverdue > 0 ? HIGH_SOFT : MED_SOFT,
                color: targetDaysOverdue > 0 ? HIGH : MED,
              }}
            >
              {targetDaysOverdue > 0 ? `${targetDaysOverdue}d Overdue` : `Due ${targetDueDate}`}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Channel Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              Select Delivery Channel
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "WhatsApp", label: "WhatsApp", icon: MessageSquare, badge: "Highest Open Rate" },
                { id: "Email", label: "Email", icon: Mail, badge: "Official Record" },
                { id: "SMS", label: "SMS", icon: Smartphone, badge: "Direct" },
                { id: "UPI_QR", label: "UPI Smart QR", icon: QrCode, badge: "Instant Pay" },
              ].map((item) => {
                const IconComponent = item.icon;
                const active = channel === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setChannel(item.id)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      active
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                        : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <IconComponent
                      size={18}
                      className={active ? "text-emerald-700" : "text-gray-500"}
                    />
                    <span className="text-xs font-semibold truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              Message Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                    selectedTemplate === tmpl.id
                      ? "border-emerald-600 bg-emerald-50/70 font-semibold text-emerald-950"
                      : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold truncate">{tmpl.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        tmpl.tone === "Firm"
                          ? "bg-rose-100 text-rose-700"
                          : tmpl.tone === "Friendly"
                          ? "bg-emerald-100 text-emerald-700"
                          : tmpl.tone === "Professional"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {tmpl.tone}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Details inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Recipient Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                style={{ borderColor: BORDER, fontFamily: MONO }}
                placeholder="+91 98000 00000"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Recipient Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                style={{ borderColor: BORDER }}
                placeholder="counterparty@email.com"
                required
              />
            </div>
          </div>

          {/* Customizable Live Preview Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                Message Content & Live Preview
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy Text"}
              </button>
            </div>
            <textarea
              rows={4}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50/50"
              style={{ borderColor: BORDER }}
            />
          </div>

          {/* Schedule toggle */}
          <div className="pt-2 border-t flex flex-col gap-2" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-800 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                Schedule this reminder for future date
              </label>
              {isScheduled && (
                <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Auto-Dispatch Enabled
                </span>
              )}
            </div>

            {isScheduled && (
              <div className="grid grid-cols-2 gap-3 mt-1 animate-in fade-in">
                <div>
                  <label className="text-[11px] font-medium text-gray-600 block mb-1">
                    Send Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
                    style={{ borderColor: BORDER }}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-600 block mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
                    style={{ borderColor: BORDER }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              style={{ borderColor: BORDER }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: PRIMARY }}
            >
              {sending ? (
                <span>Sending...</span>
              ) : isScheduled ? (
                <>
                  <Clock size={16} />
                  <span>Schedule Reminder</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send Instant Reminder</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
