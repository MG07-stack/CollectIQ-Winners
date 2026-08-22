import React from "react";
import { LayoutDashboard, FileText, Users } from "lucide-react";
import { INK, PRIMARY, SERIF } from "../theme.js";

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "invoices", label: "Invoices", icon: FileText },
  { key: "customers", label: "Customers", icon: Users },
];

export default function Sidebar({ tab, setTab }) {
  return (
    <aside className="w-full md:w-60 shrink-0 flex md:flex-col justify-between px-5 py-5 md:py-6" style={{ backgroundColor: INK }}>
      <div>
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm" style={{ backgroundColor: PRIMARY, color: "white", fontFamily: SERIF }}>
            C
          </div>
          <span className="text-white text-lg font-semibold" style={{ fontFamily: SERIF }}>CollectIQ</span>
        </div>
        <nav className="hidden md:flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left"
              style={{
                backgroundColor: tab === item.key ? "rgba(255,255,255,0.08)" : "transparent",
                color: tab === item.key ? "white" : "rgba(255,255,255,0.55)",
              }}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="hidden md:flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIMARY }} />
        Demo data · Aug 2026
      </div>
      <nav className="flex md:hidden gap-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: tab === item.key ? "rgba(255,255,255,0.08)" : "transparent",
              color: tab === item.key ? "white" : "rgba(255,255,255,0.55)",
            }}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
