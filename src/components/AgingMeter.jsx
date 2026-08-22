import React from "react";
import { PANEL, BORDER, TEXT, SUBTLE, MONO, money } from "../theme.js";
import { agingBuckets } from "../mockData.js";

export default function AgingMeter({ invoices }) {
  const unpaid = invoices.filter((i) => i.status !== "Paid");
  const buckets = agingBuckets.map((b) => ({
    ...b,
    amount: unpaid.filter((i) => b.test(i.daysOverdue)).reduce((s, i) => s + i.amount, 0),
  }));
  const total = buckets.reduce((s, b) => s + b.amount, 0) || 1;
  const colors = ["#5B7A6C", "#C0872E", "#B23A2F", "#7A2A21"];

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: TEXT }}>Aging exposure</h3>
        <span className="text-xs" style={{ color: SUBTLE }}>{money(total)} unpaid</span>
      </div>
      <div className="flex w-full h-3 rounded-full overflow-hidden mb-4" style={{ backgroundColor: "#EEEDE8" }}>
        {buckets.map((b, idx) => (
          <div key={b.key} style={{ width: `${(b.amount / total) * 100}%`, backgroundColor: colors[idx], transition: "width 0.4s ease" }} />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {buckets.map((b, idx) => (
          <div key={b.key} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx] }} />
              <span className="text-xs" style={{ color: SUBTLE }}>{b.label}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums" style={{ color: TEXT, fontFamily: MONO }}>
              {money(b.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
