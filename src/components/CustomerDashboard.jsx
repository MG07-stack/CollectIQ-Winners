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
    <div className="grid gap-2.5 sm:gap-3">
      {byCustomer.map((c) => (
        <div key={c.name} className="rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3" style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ backgroundColor: PRIMARY_SOFT, color: PRIMARY }}>
              {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-semibold truncate" style={{ color: TEXT }}>{c.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] sm:text-xs" style={{ color: SUBTLE }}>{c.invoices.length} invoices</span>
                {c.high > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: HIGH }}>
                    <AlertCircle size={11} /> {c.high} high
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center shrink-0">
            <span className="text-xs sm:text-sm font-semibold tabular-nums" style={{ color: TEXT, fontFamily: MONO }}>
              {money(c.outstanding)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
