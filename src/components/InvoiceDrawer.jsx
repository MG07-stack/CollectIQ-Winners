import React from "react";
import { X } from "lucide-react";
import { PANEL, BORDER, TEXT, SUBTLE, PRIMARY, money } from "../theme.js";
import PriorityBadge from "./PriorityBadge.jsx";
import StatusPill from "./StatusPill.jsx";

export default function InvoiceDrawer({ invoice, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: "rgba(18,23,43,0.4)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm h-full p-6 flex flex-col gap-5 overflow-y-auto"
        style={{ backgroundColor: PANEL }}
      >
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs uppercase tracking-wide" style={{ color: SUBTLE }}>Invoice</span>
            <h2 className="text-xl font-semibold" style={{ color: TEXT, fontFamily: "'IBM Plex Mono', monospace" }}>{invoice.id}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5">
            <X size={18} style={{ color: SUBTLE }} />
          </button>
        </div>
        <div className="flex gap-2">
          <PriorityBadge level={invoice.priority} />
          <StatusPill status={invoice.status} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            ["Customer", invoice.customer],
            ["Amount", money(invoice.amount)],
            ["Issued", invoice.issued],
            ["Due", invoice.due],
            ["Days overdue", invoice.daysOverdue > 0 ? `${invoice.daysOverdue} days` : "On time"],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xs" style={{ color: SUBTLE }}>{label}</span>
              <span className="text-sm font-medium" style={{ color: TEXT }}>{value}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 mt-auto pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button className="w-full py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: PRIMARY }}>
            Send payment reminder
          </button>
          <button className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ border: `1px solid ${BORDER}`, color: TEXT }}>
            Mark as paid
          </button>
        </div>
      </div>
    </div>
  );
}
