import React from "react";
import { PANEL, BORDER, TEXT, SUBTLE, MONO } from "../theme.js";

export default function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-3" style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide font-medium" style={{ color: SUBTLE }}>
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent + "1A" }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
      </div>
      <div className="text-2xl font-semibold tabular-nums" style={{ color: TEXT, fontFamily: MONO }}>
        {value}
      </div>
      {sub && <span className="text-xs" style={{ color: SUBTLE }}>{sub}</span>}
    </div>
  );
}
