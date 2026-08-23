import React, { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
  Shield,
  Mail,
  ChevronUp,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { INK, PRIMARY, SERIF } from "../theme.js";

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "invoices", label: "Invoices", icon: FileText },
  { key: "customers", label: "Counterparties", icon: Users },
  { key: "directory", label: "Credit Directory", icon: ShieldCheck },
  { key: "visits", label: "Field Visits", icon: MapPin },
];

export default function Sidebar({ tab, setTab, user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const displayName = user?.full_name || user?.name || user?.username || "User";
  const displayEmail = user?.email || `${(user?.username || "user").toLowerCase()}@collectiq.com`;
  const displayRole = user?.role || "Field Agent";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className={`w-full shrink-0 sticky top-0 z-30 md:relative flex flex-col md:justify-between transition-all duration-300 ${
        collapsed
          ? "md:w-16 px-2.5 py-3 md:py-6"
          : "md:w-64 px-4 py-3 sm:px-6 sm:py-4 md:px-5 md:py-6"
      }`}
      style={{ backgroundColor: INK }}
    >
      {/* Desktop Header */}
      <div className="hidden md:flex flex-col items-center">
        {collapsed ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <img
              src="/logo-icon.png"
              alt="CollectIQ"
              className="w-8 h-8 rounded-lg object-contain shrink-0 shadow-sm"
            />
            <button
              onClick={() => setCollapsed(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-white/10 hover:bg-white/20 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/logo-icon.png"
                alt="CollectIQ Logo"
                className="w-8 h-8 rounded-lg object-contain shrink-0 shadow-sm"
              />
              <img
                src="/logo-full.png"
                alt="CollectIQ"
                className="h-8 object-contain max-w-[160px]"
              />
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
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
          <img
            src="/logo-icon.png"
            alt="CollectIQ Logo"
            className="w-7 h-7 rounded-lg object-contain shrink-0"
          />
          <img
            src="/logo-full.png"
            alt="CollectIQ"
            className="h-7 object-contain max-w-[140px]"
          />
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center justify-center p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
              className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                collapsed
                  ? "justify-center px-0 py-2.5 h-10 w-10 mx-auto"
                  : "px-3.5 py-2.5"
              }`}
              style={{
                backgroundColor: isActive ? "rgba(255,255,255,0.14)" : "transparent",
                color: isActive ? "white" : "rgba(255,255,255,0.6)",
              }}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Desktop User Profile & Dropdown */}
      <div
        ref={profileDropdownRef}
        className="hidden md:flex flex-col gap-2 mt-auto pt-4 border-t border-white/10 relative"
      >
        {user && (
          <>
            {collapsed ? (
              <button
                onClick={onLogout}
                className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={`Sign out (${displayName})`}
              >
                <LogOut size={18} />
              </button>
            ) : (
              <>
                {/* Profile Button / Trigger */}
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-full flex items-center justify-between p-2 rounded-xl transition-colors hover:bg-white/10 text-left cursor-pointer border border-transparent hover:border-white/10"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {displayName}
                      </div>
                      <div className="text-[10px] text-white/60 truncate">
                        {displayEmail}
                      </div>
                    </div>
                  </div>
                  <ChevronUp
                    size={14}
                    className={`text-white/60 transition-transform ${
                      profileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Profile Dropdown Popup */}
                {profileDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl p-3 bg-[#1e2746] border border-white/15 shadow-2xl flex flex-col gap-2.5 animate-in fade-in zoom-in-95 z-50">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                      <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {displayName}
                        </div>
                        <div className="text-[11px] text-white/70 truncate flex items-center gap-1">
                          <Mail size={10} /> {displayEmail}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-1 py-0.5 text-xs text-white/80">
                      <span className="text-[11px] text-white/50">Role</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/40">
                        {displayRole}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full mt-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 transition-colors cursor-pointer border border-rose-500/20"
                    >
                      <LogOut size={13} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </>
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
            <div className="flex flex-col gap-2 p-3 mt-2 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                  {initial}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{displayName}</div>
                  <div className="text-[10px] text-white/50 truncate">{displayEmail}</div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
                <span className="text-[11px] text-white/50">{displayRole}</span>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    onLogout();
                  }}
                  className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-white px-2.5 py-1 rounded-lg bg-rose-500/20"
                >
                  <LogOut size={12} /> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
