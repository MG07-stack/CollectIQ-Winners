import React, { useState } from "react";
import { LayoutDashboard, FileText, Users, MapPin, ChevronLeft, ChevronRight, Menu, X, LogOut } from "lucide-react";
import { INK, PRIMARY, SERIF } from "../theme.js";

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "invoices", label: "Invoices", icon: FileText },
  { key: "customers", label: "Customers", icon: Users },
  { key: "visits", label: "Field Visits", icon: MapPin },
];

export default function Sidebar({ tab, setTab, user, onLogout }) {
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

      {/* Desktop User Profile & Sign Out Footer */}
      <div className="hidden md:flex flex-col gap-3 mt-auto pt-4 border-t border-white/10">
        {user && (
          collapsed ? (
            <button
              onClick={onLogout}
              className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title={`Sign out (${user.name || user.username})`}
            >
              <LogOut size={18} />
            </button>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                  {(user.name || user.username).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{user.name || user.username}</div>
                  <div className="text-[10px] text-white/50 truncate">{user.role || "User"}</div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          )
        )}
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

          {user && (
            <div className="flex justify-between items-center px-3 py-2.5 mt-2 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center">
                  {(user.name || user.username).charAt(0).toUpperCase()}
                </div>
                <div className="text-xs font-semibold text-white">{user.name || user.username}</div>
              </div>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onLogout();
                }}
                className="flex items-center gap-1 text-xs text-white/70 hover:text-white px-2 py-1 rounded bg-white/10"
              >
                <LogOut size={13} /> Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
