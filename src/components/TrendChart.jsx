import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PANEL, BORDER, TEXT, SUBTLE, PRIMARY, HIGH, money } from "../theme.js";
import { trendData } from "../mockData.js";

export default function TrendChart() {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: TEXT }}>Outstanding vs. overdue trend</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={trendData} margin={{ left: -20, right: 10 }}>
          <CartesianGrid stroke={BORDER} vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: SUBTLE }} axisLine={{ stroke: BORDER }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: SUBTLE }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
          <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }} />
          <Line type="monotone" dataKey="outstanding" stroke={PRIMARY} strokeWidth={2.5} dot={{ r: 3 }} name="Outstanding" />
          <Line type="monotone" dataKey="overdue" stroke={HIGH} strokeWidth={2.5} dot={{ r: 3 }} name="Overdue" />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-xs" style={{ color: SUBTLE }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIMARY }} /> Outstanding
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: SUBTLE }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: HIGH }} /> Overdue
        </span>
      </div>
    </div>
  );
}
