import React, { useMemo } from "react";
import { AlertCircle, Wifi, ChevronRight, ShieldCheck, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { PANEL, BORDER, CANVAS, TEXT, SUBTLE, PRIMARY, PRIMARY_SOFT, HIGH, MONO, money } from "../theme.js";
import { findCompany, COMPANIES_LIST } from "../mockData.js";

export default function CustomerDashboard({ invoices, onSelectCustomer, onOpenNfcProgrammer }) {
  const byCustomer = useMemo(() => {
    const map = {};

    COMPANIES_LIST.forEach((c) => {
      map[c.id] = {
        id: c.id,
        name: c.name,
        tradeName: c.tradeName,
        type: c.type,
        scale: c.scale,
        category: c.category,
        creditScore: c.creditScore,
        creditTier: c.creditTier,
        address: c.address,
        phone: c.phone,
        invoices: [],
        receivables: 0,
        payables: 0,
        high: 0,
      };
    });

    invoices.forEach((inv) => {
      const targetId = inv.customerId || inv.buyerId || inv.sellerId;
      let target = map[targetId];

      if (!target) {
        const found = findCompany(inv.customer);
        if (found) target = map[found.id];
      }

      if (target) {
        target.invoices.push(inv);
        if (inv.status !== "Paid") {
          if (inv.direction === "PAYABLE") {
            target.payables += inv.amount;
          } else {
            target.receivables += inv.amount;
          }
          if (inv.priority === "High") target.high += 1;
        }
      }
    });

    return Object.values(map).sort((a, b) => (b.receivables + b.payables) - (a.receivables + a.payables));
  }, [invoices]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-1">
        <div>
          <span className="text-xs font-semibold" style={{ color: SUBTLE }}>
            Showing {byCustomer.length} B2B counterparties & trade portfolios
          </span>
        </div>

        {onOpenNfcProgrammer && (
          <button
            onClick={onOpenNfcProgrammer}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all hover:bg-black/5 active:scale-95 shadow-xs cursor-pointer"
            style={{ borderColor: PRIMARY, color: PRIMARY, backgroundColor: PRIMARY_SOFT }}
          >
            <Wifi size={13} />
            <span>NFC Card Programmer & Guide</span>
          </button>
        )}
      </div>

      <div className="grid gap-2.5 sm:gap-3">
        {byCustomer.map((c) => {
          const totalBalance = c.receivables + c.payables;
          return (
            <div
              key={c.id}
              onClick={() => onSelectCustomer && onSelectCustomer(c.id)}
              className="rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all hover:border-emerald-700/40 hover:shadow-sm cursor-pointer"
              style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs"
                  style={{
                    backgroundColor: c.type === "Wholesaler" ? "rgba(47,111,94,0.12)" : "rgba(33,92,150,0.1)",
                    color: c.type === "Wholesaler" ? PRIMARY : "#1D5C96",
                  }}
                >
                  {c.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-xs sm:text-sm font-semibold truncate" style={{ color: TEXT }}>
                      {c.name}
                    </div>
                    <span
                      className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded"
                      style={{ backgroundColor: CANVAS, color: SUBTLE, border: `1px solid ${BORDER}` }}
                    >
                      {c.id}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md"
                      style={{
                        backgroundColor: c.scale.includes("Wholesaler") || c.scale.includes("Large") ? "rgba(47,111,94,0.1)" : "rgba(100,116,139,0.1)",
                        color: c.scale.includes("Wholesaler") || c.scale.includes("Large") ? PRIMARY : "#475569",
                      }}
                    >
                      {c.scale}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] sm:text-xs" style={{ color: SUBTLE }}>
                      {c.invoices.length} transactions • {c.category}
                    </span>
                    <span
                      className="text-[10px] font-semibold font-mono px-1.5 py-0.2 rounded-md"
                      style={{ backgroundColor: "#E6F4EA", color: "#137333" }}
                    >
                      Score: {c.creditScore}
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
                  <span className="text-xs sm:text-sm font-semibold tabular-nums block font-mono" style={{ color: TEXT }}>
                    {money(totalBalance)}
                  </span>
                  <span className="text-[10px]" style={{ color: SUBTLE }}>
                    {c.receivables > 0 ? "To Receive" : c.payables > 0 ? "To Pay" : "Settled"}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectCustomer) onSelectCustomer(c.id);
                  }}
                  title="Tap / Open NFC Profile"
                  className="p-1.5 rounded-xl border hover:bg-black/5 transition-colors text-emerald-800"
                  style={{ borderColor: BORDER }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
