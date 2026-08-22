import React, { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { PANEL, BORDER, TEXT, SUBTLE, PRIMARY, PRIMARY_SOFT, HIGH, MONO, money } from "../theme.js";

export default function CustomerDashboard({ invoices }) {
  const byCustomer = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => {
      if (!map[inv.customer]) map[inv.customer] = { name: inv.customer, invoices: [], outstanding: 0, high: 0 };
      map[inv.customer].invoices.push(inv);
      if (inv.status !== "Paid") map[inv.customer].outstanding += inv.amount;
      if (inv.priority === "High" && inv.status !== "Paid") map[inv.customer].high += 1;
    });
    return Object.values(map).sort((a, b) => b.outstanding - a.outstanding);
  }, [invoices]);

  return (
    <div className="grid gap-3">
      {byCustomer.map((c) => (
        <div key={c.name} className="rounded-xl p-4 flex items-center justify-between gap-4" style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ backgroundColor: PRIMARY_SOFT, color: PRIMARY }}>
              {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: TEXT }}>{c.name}</div>
              <div className="text-xs" style={{ color: SUBTLE }}>{c.invoices.length} invoices</div>
            </div>
          </div>
          <div className="flex items-center gap-5 shrink-0">
            {c.high > 0 && (
              <span className="hidden sm:flex items-center gap-1 text-xs" style={{ color: HIGH }}>
                <AlertCircle size={13} /> {c.high} high priority
              </span>
            )}
            <span className="text-sm font-semibold tabular-nums" style={{ color: TEXT, fontFamily: MONO }}>
              {money(c.outstanding)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
