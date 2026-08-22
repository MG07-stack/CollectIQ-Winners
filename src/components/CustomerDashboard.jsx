import React, { useMemo } from "react";
import { AlertCircle, Wifi, ChevronRight, ExternalLink } from "lucide-react";
import { PANEL, BORDER, CANVAS, TEXT, SUBTLE, PRIMARY, PRIMARY_SOFT, HIGH, MONO, money } from "../theme.js";
import { findCustomer, CUSTOMERS_LIST } from "../mockData.js";

export default function CustomerDashboard({ invoices, onSelectCustomer, onOpenNfcProgrammer }) {
  const byCustomer = useMemo(() => {
    const map = {};

    CUSTOMERS_LIST.forEach((c) => {
      map[c.name] = {
        id: c.id,
        name: c.name,
        address: c.address,
        phone: c.phone,
        invoices: [],
        outstanding: 0,
        high: 0,
      };
    });

    invoices.forEach((inv) => {
      if (!map[inv.customer]) {
        const found = findCustomer(inv.customer);
        map[inv.customer] = {
          id: found ? found.id : (inv.customerId || `CUST-${inv.customer.slice(0, 3).toUpperCase()}`),
          name: inv.customer,
          invoices: [],
          outstanding: 0,
          high: 0,
        };
      }
      map[inv.customer].invoices.push(inv);
      if (inv.status !== "Paid") map[inv.customer].outstanding += inv.amount;
      if (inv.priority === "High" && inv.status !== "Paid") map[inv.customer].high += 1;
    });

    return Object.values(map).sort((a, b) => b.outstanding - a.outstanding);
  }, [invoices]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-1">
        <span className="text-xs font-semibold" style={{ color: SUBTLE }}>
          Showing {byCustomer.length} customer portfolios
        </span>
        {onOpenNfcProgrammer && (
          <button
            onClick={onOpenNfcProgrammer}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all hover:bg-black/5 active:scale-95 shadow-xs cursor-pointer"
            style={{ borderColor: PRIMARY, color: PRIMARY, backgroundColor: PRIMARY_SOFT }}
          >
            <Wifi size={13} />
            <span>NFC Card Programmer & Guide</span>
          </button>
        )}
      </div>

      <div className="grid gap-2.5 sm:gap-3">
        {byCustomer.map((c) => (
          <div
            key={c.name}
            onClick={() => onSelectCustomer && onSelectCustomer(c.id)}
            className="rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all hover:border-emerald-700/40 hover:shadow-sm cursor-pointer"
            style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs"
                style={{ backgroundColor: PRIMARY_SOFT, color: PRIMARY }}
              >
                {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-xs sm:text-sm font-semibold truncate" style={{ color: TEXT }}>
                    {c.name}
                  </div>
                  <span
                    className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded"
                    style={{ backgroundColor: CANVAS, color: SUBTLE, border: `1px solid ${BORDER}` }}
                  >
                    {c.id}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] sm:text-xs" style={{ color: SUBTLE }}>
                    {c.invoices.length} invoices
                  </span>
                  {c.high > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: HIGH }}>
                      <AlertCircle size={11} /> {c.high} high
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-xs sm:text-sm font-semibold tabular-nums block" style={{ color: TEXT, fontFamily: MONO }}>
                  {money(c.outstanding)}
                </span>
                <span className="text-[10px]" style={{ color: SUBTLE }}>
                  Outstanding
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectCustomer) onSelectCustomer(c.id);
                }}
                title="Tap / Open NFC Profile"
                className="p-1.5 rounded-lg border hover:bg-black/5 transition-colors text-emerald-800"
                style={{ borderColor: BORDER }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

