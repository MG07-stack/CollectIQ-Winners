import React, { useState } from "react";
import { LayoutDashboard, FileText, Users, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { INK, PRIMARY, SERIF } from "../theme.js";

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "invoices", label: "Invoices", icon: FileText },
  { key: "customers", label: "Customers", icon: Users },
];

export default function Sidebar({ tab, setTab }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <aside
      className={`w-full shrink-0 sticky top-0 z-30 md:relative flex flex-col md:justify-between transition-all duration-300 ${
        collapsed ? "md:w-16 px-2.5 py-3 md:py-6" : "md:w-60 px-4 py-3 sm:px-6 sm:py-4 md:px-5 md:py-6"
      }`}
      style={{ backgroundColor: INK }}
    >
      {/* Desktop Header */}
      <div className="hidden md:flex flex-col items-center">
        {collapsed ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0"
              style={{ backgroundColor: PRIMARY, color: "white", fontFamily: SERIF }}
            >
              C
            </div>
            <button
              onClick={() => setCollapsed(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-white/10 hover:bg-white/20 transition-all shadow-sm active:scale-95"
              title="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0"
                style={{ backgroundColor: PRIMARY, color: "white", fontFamily: SERIF }}
              >
                C
              </div>
              <span className="text-white text-lg font-semibold tracking-tight" style={{ fontFamily: SERIF }}>
                CollectIQ
              </span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Header Row */}
      <div className="flex md:hidden items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-semibold text-xs shrink-0"
            style={{ backgroundColor: PRIMARY, color: "white", fontFamily: SERIF }}
          >
            C
          </div>
          <span className="text-white text-base font-semibold tracking-tight" style={{ fontFamily: SERIF }}>
            CollectIQ
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center justify-center p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex flex-col gap-1.5 mt-6">
        {navItems.map((item) => {
          const isActive = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors text-left ${
                collapsed ? "justify-center px-0 py-2.5 h-10 w-10 mx-auto" : "px-3 py-2.5"
              }`}
              style={{
                backgroundColor: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                color: isActive ? "white" : "rgba(255,255,255,0.55)",
              }}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Desktop Footer Badge */}
      <div
        className={`hidden md:flex items-center text-xs mt-auto ${collapsed ? "justify-center" : "gap-2"}`}
        style={{ color: "rgba(255,255,255,0.4)" }}
        title={collapsed ? "Demo data · Aug 2026" : undefined}
      >
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PRIMARY }} />
        {!collapsed && <span>Demo data · Aug 2026</span>}
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden flex flex-col gap-2 pt-3 mt-2 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setTab(item.key);
                  setMobileOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left"
                style={{
                  backgroundColor: isActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                  color: isActive ? "white" : "rgba(255,255,255,0.7)",
                  border: isActive ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                }}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            );
          })}
          <div className="flex items-center gap-2 text-xs px-3 py-2 mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIMARY }} />
            Demo data · Aug 2026
          </div>
        </div>
      )}
    </aside>
  );
}
