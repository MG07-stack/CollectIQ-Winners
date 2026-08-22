import React from "react";
import { PANEL, BORDER, TEXT, SUBTLE, MONO } from "../theme.js";

export default function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-xl p-3.5 sm:p-5 flex flex-col justify-between gap-2 sm:gap-3" style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] sm:text-xs uppercase tracking-wide font-medium truncate" style={{ color: SUBTLE }}>
          {label}
        </span>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: accent + "1A" }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
      </div>
      <div>
        <div className="text-lg sm:text-2xl font-semibold tabular-nums truncate" style={{ color: TEXT, fontFamily: MONO }}>
          {value}
        </div>
        {sub && <span className="text-[11px] sm:text-xs block mt-0.5 truncate" style={{ color: SUBTLE }}>{sub}</span>}
      </div>
    </div>
  );
}
