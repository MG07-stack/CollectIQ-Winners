import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PANEL, BORDER, TEXT, SUBTLE, HIGH, MED, LOW } from "../theme.js";

export default function PriorityDonut({ invoices }) {
  const unpaid = invoices.filter((i) => i.status !== "Paid");
  const data = ["High", "Medium", "Low"].map((level) => ({
    name: level,
    value: unpaid.filter((i) => i.priority === level).length,
  }));
  const colors = [HIGH, MED, LOW];

  return (
    <div className="rounded-xl p-3.5 sm:p-5 flex flex-col justify-between" style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}>
      <h3 className="text-xs sm:text-sm font-semibold mb-2" style={{ color: TEXT }}>Priority mix</h3>
      <div className="w-full h-44 sm:h-48 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={3}>
              {data.map((_, idx) => <Cell key={idx} fill={colors[idx]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-3 sm:gap-4 mt-1">
        {data.map((d, idx) => (
          <span key={d.name} className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium" style={{ color: SUBTLE }}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[idx] }} />
            {d.name} ({d.value})
          </span>
        ))}
      </div>
    </div>
  );
}
