import React from "react";
import { statusColors } from "../theme.js";

export default function StatusPill({ status }) {
  const c = statusColors[status];
  return (
    <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ color: c.fg, backgroundColor: c.bg }}>
      {status}
    </span>
  );
}
