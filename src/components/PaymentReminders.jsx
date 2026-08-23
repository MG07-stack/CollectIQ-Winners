import React, { useState } from "react";
import {
  Bell,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Calendar,
  MessageSquare,
  Mail,
  Smartphone,
  ShieldAlert,
  CreditCard,
  ChevronRight,
  Sparkles,
  Zap,
  RefreshCw,
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
  LOW,
  LOW_SOFT,
  MONO,
  money,
} from "../theme.js";
import StatusPill from "./StatusPill.jsx";
import PriorityBadge from "./PriorityBadge.jsx";

export default function PaymentReminders({
  invoices = [],
  reminders = [],
  user,
  onOpenReminderModal,
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState("payables"); // 'payables' | 'receivables' | 'logs' | 'automation'
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [automationRules, setAutomationRules] = useState([
    {
      id: "rule_predue",
      title: "Pre-Due Friendly Notice",
      trigger: "3 Days Before Due Date",
      channel: "WhatsApp",
      enabled: true,
      description: "Automatically sends a polite reminder with invoice PDF link to buyers 3 days prior to due date.",
    },
    {
      id: "rule_duedate",
      title: "Due Date Payment Link",
      trigger: "On Due Date (9:00 AM)",
      channel: "Email & SMS",
      enabled: true,
      description: "Dispatches direct UPI/Bank payment link to counterparty on the exact due date.",
    },
    {
      id: "rule_overdue7",
      title: "Urgent Overdue Escalation",
      trigger: "7 Days Overdue",
      channel: "WhatsApp & SMS",
      enabled: true,
      description: "Sends firm overdue alert warning of credit score impact if unpaid after 7 days.",
    },
    {
      id: "rule_field30",
      title: "Field Visit Dispatch Alert",
      trigger: "30 Days Overdue",
      channel: "System Alert & Field Rep",
      enabled: false,
      description: "Automatically schedules a physical field visit for agent NFC collection if 30+ days overdue.",
    },
  ]);
  const [ruleSavedMsg, setRuleSavedMsg] = useState("");

  const userCompId = user?.companyId || user?.id;

  // Filter payables (what user owes to suppliers) vs receivables (what buyers owe to user)
  const payables = invoices.filter((i) => i.direction === "PAYABLE" || i.buyerId === userCompId);
  const receivables = invoices.filter(
    (i) => (i.direction === "RECEIVABLE" || i.sellerId === userCompId || user?.role === "Admin") && i.status !== "Paid"
  );

  const pendingPayables = payables.filter((i) => i.status !== "Paid");
  const totalPayablesAmount = pendingPayables.reduce((acc, i) => acc + (i.amount || 0), 0);
  const overduePayablesAmount = pendingPayables
    .filter((i) => (i.daysOverdue || 0) > 0)
    .reduce((acc, i) => acc + (i.amount || 0), 0);

  const totalReceivablesAmount = receivables.reduce((acc, i) => acc + (i.amount || 0), 0);
  const overdueReceivablesAmount = receivables
    .filter((i) => (i.daysOverdue || 0) > 0)
    .reduce((acc, i) => acc + (i.amount || 0), 0);

  // Filtered payables list search
  const filteredPayables = pendingPayables.filter((i) => {
    const matchesSearch =
      i.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.customer || i.sellerName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === "ALL" || i.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  // Filtered receivables list search
  const filteredReceivables = receivables.filter((i) => {
    const matchesSearch =
      i.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.customer || i.buyerName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === "ALL" || i.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  function toggleSelectInvoice(id) {
    if (selectedInvoices.includes(id)) {
      setSelectedInvoices(selectedInvoices.filter((i) => i !== id));
    } else {
      setSelectedInvoices([...selectedInvoices, id]);
    }
  }

  function handleRuleToggle(ruleId) {
    setAutomationRules(
      automationRules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  }

  function handleSaveAutomation() {
    setRuleSavedMsg("Automation schedule rules saved successfully!");
    setTimeout(() => setRuleSavedMsg(""), 2000);
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Payment Reminders Hub
            </h1>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: PRIMARY_SOFT, color: PRIMARY }}
            >
              Multi-Channel Dispatch
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your pending payables due to suppliers & automate payment reminders to buyers
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl border bg-white text-gray-600 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
          )}
          <button
            onClick={() => onOpenReminderModal && onOpenReminderModal()}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            style={{ backgroundColor: PRIMARY }}
          >
            <Send size={16} />
            <span>Send New Reminder</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Pending Payables */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: PANEL, borderColor: BORDER }}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                My Pending Payables
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-1" style={{ fontFamily: MONO }}>
                {money(totalPayablesAmount)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-gray-100">
            <span className="text-rose-600 font-medium flex items-center gap-1">
              <AlertTriangle size={12} />
              {money(overduePayablesAmount)} overdue
            </span>
            <span className="text-gray-500 font-medium">{pendingPayables.length} bills due</span>
          </div>
        </div>

        {/* Card 2: Receivables Owed to Us */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: PANEL, borderColor: BORDER }}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Counterparty Owed
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-1" style={{ fontFamily: MONO }}>
                {money(totalReceivablesAmount)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowDownLeft size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-gray-100">
            <span className="text-emerald-700 font-medium">
              {receivables.length} buyers to remind
            </span>
            <span className="text-rose-600 font-medium">
              {money(overdueReceivablesAmount)} overdue
            </span>
          </div>
        </div>

        {/* Card 3: Reminders Sent */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: PANEL, borderColor: BORDER }}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Reminders Sent
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-1" style={{ fontFamily: MONO }}>
                {reminders.length || 3} Dispatched
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Bell size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-gray-100">
            <span className="text-blue-600 font-medium">WhatsApp / Email / SMS</span>
            <span className="text-emerald-600 font-semibold">96% Delivery</span>
          </div>
        </div>

        {/* Card 4: Active Automation */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: PANEL, borderColor: BORDER }}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Auto Rules Active
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-1" style={{ fontFamily: MONO }}>
                {automationRules.filter((r) => r.enabled).length} / {automationRules.length} Rules
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Zap size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-gray-100">
            <span className="text-purple-700 font-medium">Auto-dispatch enabled</span>
            <span className="text-gray-500">Every 24h</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div
        className="rounded-2xl border shadow-sm overflow-hidden"
        style={{ backgroundColor: PANEL, borderColor: BORDER }}
      >
        <div className="border-b bg-gray-50/70 p-2 sm:px-4 flex flex-wrap gap-1 sm:gap-2" style={{ borderColor: BORDER }}>
          {[
            {
              id: "payables",
              label: "My Bills to Pay (Payables)",
              icon: CreditCard,
              badge: pendingPayables.length,
            },
            {
              id: "receivables",
              label: "Counterparties to Remind (Receivables)",
              icon: Send,
              badge: receivables.length,
            },
            {
              id: "logs",
              label: "Reminder Logs & History",
              icon: Clock,
              badge: reminders.length || 3,
            },
            {
              id: "automation",
              label: "Automated Schedule Rules",
              icon: Zap,
              badge: "Auto",
            },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
                }`}
              >
                <TabIcon size={16} className={isActive ? "text-emerald-700" : "text-gray-500"} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content 1: My Bills to Pay (Payables) */}
        {activeTab === "payables" && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoice or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  style={{ borderColor: BORDER }}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 text-xs border rounded-xl bg-white focus:outline-none"
                  style={{ borderColor: BORDER }}
                >
                  <option value="ALL">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>

            {filteredPayables.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-semibold text-gray-800">No pending payables!</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  You have settled all bills due to your wholesalers and suppliers.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-xl" style={{ borderColor: BORDER }}>
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-500 uppercase text-[11px] font-semibold tracking-wider" style={{ borderColor: BORDER }}>
                      <th className="p-3 sm:p-4">Supplier / Vendor</th>
                      <th className="p-3 sm:p-4">Invoice ID</th>
                      <th className="p-3 sm:p-4">Due Date</th>
                      <th className="p-3 sm:p-4">Status & Overdue</th>
                      <th className="p-3 sm:p-4 text-right">Amount Owed</th>
                      <th className="p-3 sm:p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayables.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-3 sm:p-4 font-semibold text-gray-900">
                          {inv.sellerName || inv.customer || "Wholesale Distributor"}
                        </td>
                        <td className="p-3 sm:p-4 font-mono font-medium text-gray-700">
                          {inv.id}
                        </td>
                        <td className="p-3 sm:p-4 text-gray-600">{inv.due || inv.dueDate}</td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center gap-2">
                            <StatusPill status={inv.status} />
                            {inv.daysOverdue > 0 && (
                              <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-rose-100 text-rose-800">
                                {inv.daysOverdue}d overdue
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-right font-bold text-gray-900" style={{ fontFamily: MONO }}>
                          {money(inv.amount)}
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                onOpenReminderModal &&
                                onOpenReminderModal({
                                  ...inv,
                                  customer: inv.sellerName || inv.customer,
                                })
                              }
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              Remind Self
                            </button>
                            <button
                              onClick={() => alert(`Simulated Instant Payment Gateway for Invoice #${inv.id}`)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity active:opacity-90 cursor-pointer shadow-sm"
                              style={{ backgroundColor: PRIMARY }}
                            >
                              Pay Now
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Counterparties to Remind (Receivables) */}
        {activeTab === "receivables" && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search buyer or invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  style={{ borderColor: BORDER }}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    if (filteredReceivables.length > 0 && onOpenReminderModal) {
                      onOpenReminderModal(filteredReceivables[0]);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Bulk Remind Overdue</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-xl" style={{ borderColor: BORDER }}>
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-gray-500 uppercase text-[11px] font-semibold tracking-wider" style={{ borderColor: BORDER }}>
                    <th className="p-3 sm:p-4">Counterparty / Buyer</th>
                    <th className="p-3 sm:p-4">Invoice ID</th>
                    <th className="p-3 sm:p-4">Priority</th>
                    <th className="p-3 sm:p-4">Status & Overdue</th>
                    <th className="p-3 sm:p-4 text-right">Amount Owed</th>
                    <th className="p-3 sm:p-4 text-right">Send Notice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReceivables.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-3 sm:p-4 font-semibold text-gray-900">
                        {inv.customer || inv.buyerName || "Retail Merchant"}
                      </td>
                      <td className="p-3 sm:p-4 font-mono font-medium text-gray-700">
                        {inv.id}
                      </td>
                      <td className="p-3 sm:p-4">
                        <PriorityBadge level={inv.priority} />
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2">
                          <StatusPill status={inv.status} />
                          {inv.daysOverdue > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-rose-100 text-rose-800">
                              {inv.daysOverdue}d overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-right font-bold text-gray-900" style={{ fontFamily: MONO }}>
                        {money(inv.amount)}
                      </td>
                      <td className="p-3 sm:p-4 text-right">
                        <button
                          onClick={() => onOpenReminderModal && onOpenReminderModal(inv)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition-opacity active:opacity-90 cursor-pointer flex items-center gap-1.5 ml-auto"
                          style={{ backgroundColor: PRIMARY }}
                        >
                          <Send size={13} />
                          <span>Remind</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 3: Reminder Logs & History */}
        {activeTab === "logs" && (
          <div className="p-4 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-800">Recent Reminder History & Delivery Status</h3>
            <div className="space-y-3">
              {(reminders.length > 0 ? reminders : [
                {
                  id: "REM-1001",
                  invoiceId: "INV-2026-102",
                  buyerName: "Gupta Kirana & General Store",
                  amount: 68000,
                  channel: "WhatsApp",
                  recipientPhone: "+91 98111 22334",
                  template: "Urgent Overdue Notice",
                  sentAt: new Date().toISOString(),
                  status: "Delivered",
                },
                {
                  id: "REM-1002",
                  invoiceId: "INV-2026-105",
                  buyerName: "Apex FMCG Wholesalers",
                  amount: 520000,
                  channel: "Email",
                  recipientEmail: "apex@collectiq.com",
                  template: "Upcoming Payment Reminder",
                  sentAt: new Date(Date.now() - 86400000).toISOString(),
                  status: "Read",
                },
              ]).map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm transition-shadow"
                  style={{ borderColor: BORDER, backgroundColor: "#FAFBFB" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                      {log.channel === "WhatsApp" ? (
                        <MessageSquare size={18} />
                      ) : log.channel === "Email" ? (
                        <Mail size={18} />
                      ) : (
                        <Smartphone size={18} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm">
                          {log.buyerName || log.customerName || "Counterparty"}
                        </span>
                        <span className="text-[11px] font-mono text-gray-500">
                          ({log.invoiceId})
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Template: <span className="font-semibold text-gray-800">{log.template}</span> via{" "}
                        <span className="font-semibold text-emerald-700">{log.channel}</span>
                      </p>
                      <span className="text-[11px] text-gray-400 mt-1 block">
                        Sent on {new Date(log.sentAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-900 block" style={{ fontFamily: MONO }}>
                        {money(log.amount)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 inline-block mt-0.5">
                        ✓ {log.status || "Delivered"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 4: Automated Schedule Rules */}
        {activeTab === "automation" && (
          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Automated Reminder Dispatch Engine</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure automatic background schedules to dispatch reminders without manual effort
                </p>
              </div>
              <button
                onClick={handleSaveAutomation}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                style={{ backgroundColor: PRIMARY }}
              >
                Save Automation Rules
              </button>
            </div>

            {ruleSavedMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>{ruleSavedMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {automationRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border transition-all ${
                    rule.enabled
                      ? "bg-white border-emerald-200 shadow-sm"
                      : "bg-gray-50 border-gray-200 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900">{rule.title}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-100 text-purple-800">
                          {rule.channel}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 mt-1 block">
                        Trigger: {rule.trigger}
                      </span>
                    </div>

                    {/* Toggle switch */}
                    <button
                      type="button"
                      onClick={() => handleRuleToggle(rule.id)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        rule.enabled ? "bg-emerald-600 justify-end" : "bg-gray-300 justify-start"
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
