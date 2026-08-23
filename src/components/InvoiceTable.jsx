import React, { useState, useMemo } from "react";
import { Search, ArrowUpDown, ChevronRight, ArrowDownLeft, ArrowUpRight, Filter } from "lucide-react";
import { PANEL, BORDER, CANVAS, TEXT, SUBTLE, MONO, PRIMARY, PRIMARY_SOFT, money } from "../theme.js";
import PriorityBadge from "./PriorityBadge.jsx";
import StatusPill from "./StatusPill.jsx";
import InvoiceDrawer from "./InvoiceDrawer.jsx";

const columns = [
  { key: "id", label: "Invoice #" },
  { key: "direction", label: "Type" },
  { key: "customer", label: "Counterparty" },
  { key: "amount", label: "Amount" },
  { key: "daysOverdue", label: "Days overdue" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
];

export default function InvoiceTable({ invoices = [], onOpenReminderModal }) {
  const [directionTab, setDirectionTab] = useState("ALL"); // ALL | RECEIVABLE | PAYABLE
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState("daysOverdue");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(null);

  const totalReceivables = useMemo(
    () => invoices.filter((i) => i.direction === "RECEIVABLE" && i.status !== "Paid").reduce((s, i) => s + (i.amount || 0), 0),
    [invoices]
  );
  const totalPayables = useMemo(
    () => invoices.filter((i) => i.direction === "PAYABLE" && i.status !== "Paid").reduce((s, i) => s + (i.amount || 0), 0),
    [invoices]
  );

  const filtered = useMemo(() => {
    let rows = invoices.filter((inv) => {
      const matchesDirection =
        directionTab === "ALL" ||
        inv.direction === directionTab ||
        (!inv.direction && directionTab === "RECEIVABLE");

      const matchesSearch =
        (inv.customer || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.buyerName || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.sellerName || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.id || "").toLowerCase().includes(search.toLowerCase());

      const matchesPriority = priorityFilter === "All" || inv.priority === priorityFilter;
      const matchesStatus = statusFilter === "All" || inv.status === statusFilter;
      return matchesDirection && matchesSearch && matchesPriority && matchesStatus;
    });

    rows.sort((a, b) => {
      let av = a[sortKey],
        bv = b[sortKey];
      if (typeof av === "string") {
        av = av.toLowerCase();
        bv = bv.toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [invoices, directionTab, search, priorityFilter, statusFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const receivablesCount = invoices.filter((i) => i.direction === "RECEIVABLE" || !i.direction).length;
  const payablesCount = invoices.filter((i) => i.direction === "PAYABLE").length;

  return (
    <div className="rounded-2xl overflow-hidden shadow-xs flex flex-col" style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}>
      {/* Top Direction Switcher Tabs */}
      <div
        className="px-4 py-3 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 border-b"
        style={{ backgroundColor: CANVAS, borderColor: BORDER }}
      >
        <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-white/70" style={{ borderColor: BORDER }}>
          <button
            type="button"
            onClick={() => setDirectionTab("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              directionTab === "ALL"
                ? "bg-gray-900 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-black/5"
            }`}
          >
            All ({invoices.length})
          </button>

          <button
            type="button"
            onClick={() => setDirectionTab("RECEIVABLE")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              directionTab === "RECEIVABLE"
                ? "bg-emerald-800 text-white shadow-xs"
                : "text-emerald-800 hover:bg-emerald-50"
            }`}
          >
            <ArrowDownLeft size={13} />
            <span>To Receive (Receivables)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-white/20">
              {receivablesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDirectionTab("PAYABLE")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              directionTab === "PAYABLE"
                ? "bg-amber-800 text-white shadow-xs"
                : "text-amber-800 hover:bg-amber-50"
            }`}
          >
            <ArrowUpRight size={13} />
            <span>To Pay (Payables)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-white/20">
              {payablesCount}
            </span>
          </button>
        </div>

        {/* Quick Amount Summary */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1 text-emerald-800 font-semibold">
            <span>To Receive:</span>
            <span>{money(totalReceivables)}</span>
          </div>
          <div className="h-3 w-px bg-gray-300" />
          <div className="flex items-center gap-1 text-amber-800 font-semibold">
            <span>To Pay:</span>
            <span>{money(totalPayables)}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3 sm:items-center" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: SUBTLE }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, buyer, supplier or company..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm outline-none transition-shadow focus:ring-2 focus:ring-emerald-500/20"
            style={{ border: `1px solid ${BORDER}`, backgroundColor: CANVAS, color: TEXT }}
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs sm:text-sm rounded-xl px-2.5 py-2 outline-none cursor-pointer border"
            style={{ borderColor: BORDER, backgroundColor: CANVAS, color: TEXT }}
          >
            {["All", "High", "Medium", "Low"].map((p) => (
              <option key={p} value={p}>
                Priority: {p}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs sm:text-sm rounded-xl px-2.5 py-2 outline-none cursor-pointer border"
            style={{ borderColor: BORDER, backgroundColor: CANVAS, color: TEXT }}
          >
            {["All", "Outstanding", "Overdue", "Partially Paid", "Paid"].map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: CANVAS }}>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className="text-left px-4 py-3 font-medium cursor-pointer select-none whitespace-nowrap"
                  style={{ color: SUBTLE }}
                >
                  <span className="flex items-center gap-1">
                    {c.label}
                    <ArrowUpDown size={12} style={{ opacity: sortKey === c.key ? 1 : 0.3 }} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => {
              const isReceivable = inv.direction === "RECEIVABLE" || !inv.direction;
              return (
                <tr
                  key={inv.id}
                  onClick={() => setSelected(inv)}
                  className="cursor-pointer hover:bg-black/[0.02] transition-colors"
                  style={{ borderTop: `1px solid ${BORDER}` }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: TEXT, fontFamily: MONO }}>
                    {inv.id}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isReceivable ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {isReceivable ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                      {isReceivable ? "Receivable (Inward)" : "Payable (Outward)"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold block" style={{ color: TEXT }}>
                      {inv.customer}
                    </span>
                    <span className="text-[11px] block" style={{ color: SUBTLE }}>
                      {isReceivable ? `Buyer: ${inv.customer}` : `Supplier: ${inv.customer}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums font-semibold" style={{ color: TEXT, fontFamily: MONO }}>
                    {money(inv.amount)}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-mono" style={{ color: inv.daysOverdue > 0 ? "#B23A2F" : SUBTLE }}>
                    {inv.daysOverdue > 0 ? `${inv.daysOverdue}d overdue` : "On Schedule"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={inv.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge level={inv.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight size={16} style={{ color: SUBTLE }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm" style={{ color: SUBTLE }}>
            No invoices match your selected filters.
          </div>
        )}
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden divide-y" style={{ borderColor: BORDER }}>
        {filtered.map((inv) => {
          const isReceivable = inv.direction === "RECEIVABLE" || !inv.direction;
          return (
            <div
              key={inv.id}
              onClick={() => setSelected(inv)}
              className="p-3.5 flex flex-col gap-2 active:bg-black/[0.04] transition-colors cursor-pointer"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs sm:text-sm" style={{ color: TEXT, fontFamily: MONO }}>
                    {inv.id}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                      isReceivable ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {isReceivable ? "Inward" : "Outward"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge level={inv.priority} />
                  <ChevronRight size={15} style={{ color: SUBTLE }} />
                </div>
              </div>

              <span className="text-xs sm:text-sm font-medium" style={{ color: TEXT }}>
                {inv.customer}
              </span>

              <div className="flex justify-between items-center mt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums font-mono" style={{ color: TEXT }}>
                    {money(inv.amount)}
                  </span>
                  {inv.daysOverdue > 0 && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded font-mono bg-red-50 text-red-700">
                      {inv.daysOverdue}d overdue
                    </span>
                  )}
                </div>
                <StatusPill status={inv.status} />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-xs sm:text-sm" style={{ color: SUBTLE }}>
            No invoices match your selected filters.
          </div>
        )}
      </div>

      {selected && (
        <InvoiceDrawer
          invoice={selected}
          onClose={() => setSelected(null)}
          onOpenReminderModal={onOpenReminderModal}
        />
      )}
    </div>
  );
}
