import React from "react";
import { X } from "lucide-react";
import { PANEL, BORDER, TEXT, SUBTLE, PRIMARY, money } from "../theme.js";
import PriorityBadge from "./PriorityBadge.jsx";
import StatusPill from "./StatusPill.jsx";

export default function InvoiceDrawer({ invoice, onClose, onOpenReminderModal }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch justify-center sm:justify-end transition-opacity animate-in fade-in duration-200" style={{ backgroundColor: "rgba(18,23,43,0.5)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm max-h-[92vh] sm:max-h-full sm:h-full rounded-t-2xl sm:rounded-none p-5 sm:p-6 flex flex-col gap-4 sm:gap-5 overflow-y-auto shadow-2xl"
        style={{ backgroundColor: PANEL }}
      >
        <div className="w-12 h-1 rounded-full mx-auto sm:hidden -mt-1 mb-1 shrink-0" style={{ backgroundColor: BORDER }} />
        <div className="flex justify-between items-start shrink-0">
          <div>
            <span className="text-[11px] sm:text-xs uppercase tracking-wide font-medium" style={{ color: SUBTLE }}>Invoice details</span>
            <h2 className="text-lg sm:text-xl font-semibold mt-0.5" style={{ color: TEXT, fontFamily: "'IBM Plex Mono', monospace" }}>{invoice.id}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
            <X size={18} style={{ color: SUBTLE }} />
          </button>
        </div>
        <div className="flex gap-2 shrink-0">
          <PriorityBadge level={invoice.priority} />
          <StatusPill status={invoice.status} />
        </div>
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4 my-1">
          {[
            ["Customer", invoice.customer],
            ["Amount", money(invoice.amount)],
            ["Issued", invoice.issued],
            ["Due", invoice.due],
            ["Days overdue", invoice.daysOverdue > 0 ? `${invoice.daysOverdue} days` : "On time"],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[11px] sm:text-xs" style={{ color: SUBTLE }}>{label}</span>
              <span className="text-xs sm:text-sm font-semibold truncate" style={{ color: TEXT }}>{value}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 mt-auto pt-4 shrink-0" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={() => {
              if (onOpenReminderModal) onOpenReminderModal(invoice);
              if (onClose) onClose();
            }}
            className="w-full py-2.5 rounded-lg text-xs sm:text-sm font-medium text-white transition-opacity active:opacity-90 cursor-pointer"
            style={{ backgroundColor: PRIMARY }}
          >
            Send payment reminder
          </button>
          <button className="w-full py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors hover:bg-black/[0.02]" style={{ border: `1px solid ${BORDER}`, color: TEXT }}>
            Mark as paid
          </button>
        </div>
      </div>
    </div>
  );
}
