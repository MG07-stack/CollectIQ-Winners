import React, { useState, useMemo } from "react";
import { Search, ArrowUpDown, ChevronRight } from "lucide-react";
import { PANEL, BORDER, CANVAS, TEXT, SUBTLE, MONO } from "../theme.js";
import { STATUSES } from "../mockData.js";
import PriorityBadge from "./PriorityBadge.jsx";
import StatusPill from "./StatusPill.jsx";
import InvoiceDrawer from "./InvoiceDrawer.jsx";

const columns = [
  { key: "id", label: "Invoice" },
  { key: "customer", label: "Customer" },
  { key: "amount", label: "Amount" },
  { key: "daysOverdue", label: "Days overdue" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
];

export default function InvoiceTable({ invoices }) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState("daysOverdue");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    let rows = invoices.filter((inv) => {
      const matchesSearch =
        inv.customer.toLowerCase().includes(search.toLowerCase()) ||
        inv.id.toLowerCase().includes(search.toLowerCase());
      const matchesPriority = priorityFilter === "All" || inv.priority === priorityFilter;
      const matchesStatus = statusFilter === "All" || inv.status === statusFilter;
      return matchesSearch && matchesPriority && matchesStatus;
    });
    rows.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [invoices, search, priorityFilter, statusFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}>
      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3 sm:items-center" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: SUBTLE }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice or customer..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-xs sm:text-sm outline-none transition-shadow focus:ring-2 focus:ring-emerald-500/20"
            style={{ border: `1px solid ${BORDER}`, backgroundColor: CANVAS, color: TEXT }}
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs sm:text-sm rounded-lg px-2.5 py-2 outline-none cursor-pointer"
            style={{ border: `1px solid ${BORDER}`, backgroundColor: CANVAS, color: TEXT }}
          >
            {["All", "High", "Medium", "Low"].map((p) => <option key={p} value={p}>Priority: {p}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs sm:text-sm rounded-lg px-2.5 py-2 outline-none cursor-pointer"
            style={{ border: `1px solid ${BORDER}`, backgroundColor: CANVAS, color: TEXT }}
          >
            {["All", ...STATUSES].map((s) => <option key={s} value={s}>Status: {s}</option>)}
          </select>
        </div>
      </div>

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
            {filtered.map((inv) => (
              <tr
                key={inv.id}
                onClick={() => setSelected(inv)}
                className="cursor-pointer hover:bg-black/[0.02] transition-colors"
                style={{ borderTop: `1px solid ${BORDER}` }}
              >
                <td className="px-4 py-3 font-medium" style={{ color: TEXT, fontFamily: MONO }}>{inv.id}</td>
                <td className="px-4 py-3" style={{ color: TEXT }}>{inv.customer}</td>
                <td className="px-4 py-3 tabular-nums" style={{ color: TEXT, fontFamily: MONO }}>
                  {inv.amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 tabular-nums" style={{ color: SUBTLE, fontFamily: MONO }}>
                  {inv.daysOverdue > 0 ? `${inv.daysOverdue}d` : "—"}
                </td>
                <td className="px-4 py-3"><StatusPill status={inv.status} /></td>
                <td className="px-4 py-3"><PriorityBadge level={inv.priority} /></td>
                <td className="px-4 py-3"><ChevronRight size={16} style={{ color: SUBTLE }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm" style={{ color: SUBTLE }}>No invoices match your filters.</div>
        )}
      </div>

      <div className="md:hidden divide-y" style={{ borderColor: BORDER }}>
        {filtered.map((inv) => (
          <div
            key={inv.id}
            onClick={() => setSelected(inv)}
            className="p-3.5 flex flex-col gap-2 active:bg-black/[0.04] transition-colors cursor-pointer"
            style={{ borderTop: `1px solid ${BORDER}` }}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-xs sm:text-sm" style={{ color: TEXT, fontFamily: MONO }}>{inv.id}</span>
              <div className="flex items-center gap-2">
                <PriorityBadge level={inv.priority} />
                <ChevronRight size={15} style={{ color: SUBTLE }} />
              </div>
            </div>
            <span className="text-xs sm:text-sm font-medium" style={{ color: TEXT }}>{inv.customer}</span>
            <div className="flex justify-between items-center mt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums" style={{ color: TEXT, fontFamily: MONO }}>
                  {inv.amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                </span>
                {inv.daysOverdue > 0 && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: "#FDF2F2", color: "#B23A2F" }}>
                    {inv.daysOverdue}d overdue
                  </span>
                )}
              </div>
              <StatusPill status={inv.status} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-xs sm:text-sm" style={{ color: SUBTLE }}>No invoices match your filters.</div>
        )}
      </div>

      {selected && <InvoiceDrawer invoice={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
