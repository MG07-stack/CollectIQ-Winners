import React from "react";
import { priorityColors } from "../theme.js";

export default function PriorityBadge({ level }) {
  const c = priorityColors[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ color: c.fg, backgroundColor: c.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.fg }} />
      {level}
    </span>
  );
}
