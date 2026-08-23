import React, { useState, useEffect } from "react";
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  Building2,
  TrendingUp,
  TrendingDown,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  FileCheck2,
  SlidersHorizontal,
  ExternalLink,
  Sparkles,
  Info,
} from "lucide-react";
import {
  PANEL,
  BORDER,
  CANVAS,
  TEXT,
  SUBTLE,
  PRIMARY,
  PRIMARY_SOFT,
  HIGH,
  HIGH_SOFT,
  MED,
  MED_SOFT,
  MONO,
  SERIF,
  money,
} from "../theme.js";
import { searchCompanies } from "../api.js";

const FILTER_TYPES = ["All", "Wholesaler", "Distributor", "Retailer", "Service"];
const SCALE_FILTERS = ["All Scales", "Large Enterprise", "Mid Wholesaler", "Small Retailer", "Micro Merchant"];

export default function CompanySearch({ token, onSelectCompany }) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedScale, setSelectedScale] = useState("All Scales");
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyModal, setSelectedCompanyModal] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDirectory() {
      setLoading(true);
      try {
        const results = await searchCompanies(query, token);
        if (isMounted) setCompanies(results || []);
      } catch (err) {
        console.error("Directory search failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadDirectory();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, token]);

  const filteredCompanies = companies.filter((comp) => {
    const matchesType = selectedType === "All" || comp.type === selectedType;
    const matchesScale = selectedScale === "All Scales" || comp.scale === selectedScale;
    return matchesType && matchesScale;
  });

  function getScoreColor(score) {
    if (score >= 780) return { bg: "#E6F4EA", text: "#137333", border: "#CEEAD6", label: "Excellent" };
    if (score >= 700) return { bg: "#EBF3FA", text: "#1D5C96", border: "#C8DEF0", label: "Good" };
    if (score >= 620) return { bg: "#FEF7E0", text: "#B06000", border: "#FEEFC3", label: "Moderate" };
    return { bg: "#FCE8E6", text: "#C5221F", border: "#FAD2CF", label: "High Risk" };
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header Banner */}
      <div
        className="rounded-2xl p-5 sm:p-6 border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
        style={{
          background: "linear-gradient(135deg, rgba(47,111,94,0.08) 0%, rgba(20,29,26,0.02) 100%)",
          borderColor: BORDER,
        }}
      >
        <div className="flex items-start gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
            style={{ backgroundColor: PRIMARY }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: TEXT, fontFamily: SERIF }}>
              B2B Credit Directory & Market Exposure Search
            </h2>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: SUBTLE }}>
              Verify any company’s CollectIQ Trust Score and net market balance without exposing confidential private invoices.
            </p>
          </div>
        </div>

        {/* Privacy Guarantee Pill */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0"
          style={{ backgroundColor: "rgba(47,111,94,0.12)", color: PRIMARY, border: "1px solid rgba(47,111,94,0.25)" }}
        >
          <Lock size={12} />
          <span>100% Privacy Protected</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        className="rounded-2xl p-4 sm:p-5 border shadow-xs flex flex-col gap-3.5"
        style={{ backgroundColor: PANEL, borderColor: BORDER }}
      >
        <div className="relative w-full">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: SUBTLE }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by company name, category, GSTIN, city (e.g. Apex, FMCG, Kirana, Surat, Pharma)..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-emerald-700/20"
            style={{ backgroundColor: CANVAS, border: `1px solid ${BORDER}`, color: TEXT }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t" style={{ borderColor: BORDER }}>
          {/* Industry Type Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider mr-1" style={{ color: SUBTLE }}>
              Type:
            </span>
            {FILTER_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedType === t
                    ? "bg-emerald-900 text-white border-emerald-900 shadow-xs font-semibold"
                    : "hover:bg-black/5 text-gray-700"
                }`}
                style={selectedType !== t ? { borderColor: BORDER, backgroundColor: CANVAS } : {}}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Scale Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: SUBTLE }}>
              Scale:
            </span>
            <select
              value={selectedScale}
              onChange={(e) => setSelectedScale(e.target.value)}
              className="text-xs rounded-lg px-2.5 py-1 outline-none cursor-pointer border"
              style={{ backgroundColor: CANVAS, borderColor: BORDER, color: TEXT }}
            >
              {SCALE_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Directory Company Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs sm:text-sm" style={{ color: SUBTLE }}>
          Searching B2B Credit Registry...
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div
          className="py-12 px-4 text-center rounded-2xl border flex flex-col items-center gap-2"
          style={{ backgroundColor: PANEL, borderColor: BORDER }}
        >
          <Building2 size={32} style={{ color: SUBTLE }} />
          <h4 className="text-sm font-semibold" style={{ color: TEXT }}>
            No companies matching "{query}"
          </h4>
          <p className="text-xs max-w-sm" style={{ color: SUBTLE }}>
            Try searching by another company trade name, industry (Electronics, Pharma, Hardware), or city.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCompanies.map((comp) => {
            const scoreStyle = getScoreColor(comp.creditScore);
            const isNetPositive = comp.netMarketStanding >= 0;

            return (
              <div
                key={comp.id}
                onClick={() => setSelectedCompanyModal(comp)}
                className="rounded-2xl p-4 sm:p-5 border transition-all hover:shadow-md hover:border-emerald-700/40 flex flex-col justify-between gap-4 cursor-pointer"
                style={{ backgroundColor: PANEL, borderColor: BORDER }}
              >
                {/* Top Row: Info & Trust Score Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border"
                      style={{
                        backgroundColor: comp.type === "Wholesaler" ? "rgba(47,111,94,0.12)" : "rgba(33,92,150,0.1)",
                        borderColor: comp.type === "Wholesaler" ? PRIMARY : "#1D5C96",
                        color: comp.type === "Wholesaler" ? PRIMARY : "#1D5C96",
                      }}
                    >
                      {comp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base leading-snug truncate" style={{ color: TEXT }}>
                          {comp.name}
                        </h3>
                        {comp.verified && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md"
                            style={{ backgroundColor: "#E6F4EA", color: "#137333" }}
                            title="Verified Business with Active GSTIN"
                          >
                            <CheckCircle2 size={10} /> GST Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: SUBTLE }}>
                        {comp.category} • {comp.city}, {comp.state}
                      </p>
                    </div>
                  </div>

                  {/* Trust Score Tag */}
                  <div
                    className="flex flex-col items-end px-2.5 py-1.5 rounded-xl border shrink-0 text-right"
                    style={{ backgroundColor: scoreStyle.bg, borderColor: scoreStyle.border }}
                  >
                    <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: scoreStyle.text }}>
                      Trust Score
                    </span>
                    <span className="text-base font-extrabold font-mono leading-none mt-0.5" style={{ color: scoreStyle.text }}>
                      {comp.creditScore}
                      <span className="text-[10px] font-normal opacity-70"> /900</span>
                    </span>
                    <span className="text-[10px] font-bold mt-0.5" style={{ color: scoreStyle.text }}>
                      {scoreStyle.label}
                    </span>
                  </div>
                </div>

                {/* Middle: Market Exposure Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl border" style={{ backgroundColor: CANVAS, borderColor: BORDER }}>
                  {/* Total to pay to market */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: SUBTLE }}>
                      <ArrowUpRight size={11} className="text-amber-700" /> Overall To Pay
                    </span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-gray-900 mt-0.5">
                      {money(comp.totalMarketPayables)}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {comp.overduePayables > 0 ? `${money(comp.overduePayables)} overdue` : "Zero overdue"}
                    </span>
                  </div>

                  {/* Total credit given out */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: SUBTLE }}>
                      <ArrowDownLeft size={11} className="text-emerald-700" /> Credit Given
                    </span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-gray-900 mt-0.5">
                      {money(comp.totalMarketReceivables)}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {comp.openReceivablesCount} active invoices
                    </span>
                  </div>

                  {/* Net Market Standing (Given Extra / Net Debt) */}
                  <div className="col-span-2 sm:col-span-1 flex flex-col pt-1.5 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:pl-2.5" style={{ borderColor: BORDER }}>
                    <span className="text-[10px] font-medium" style={{ color: SUBTLE }}>
                      Net Standing
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-bold font-mono mt-0.5 ${
                        isNetPositive ? "text-emerald-800" : "text-amber-800"
                      }`}
                    >
                      {isNetPositive ? `+${money(comp.netMarketStanding)}` : `-${money(Math.abs(comp.netMarketStanding))}`}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-600">
                      {isNetPositive ? "Net Extra Given" : "Net Market Balance"}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Scale, Settlement Rate, View Button */}
                <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: BORDER }}>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: comp.scale.includes("Wholesaler") || comp.scale.includes("Large") ? "rgba(47,111,94,0.1)" : "rgba(100,116,139,0.1)",
                        color: comp.scale.includes("Wholesaler") || comp.scale.includes("Large") ? PRIMARY : "#475569",
                      }}
                    >
                      {comp.scale}
                    </span>
                    <span className="text-[11px]" style={{ color: SUBTLE }}>
                      ⏱ {comp.avgSettlementDays}d avg terms
                    </span>
                  </div>

                  <span className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: PRIMARY }}>
                    Inspect profile <ExternalLink size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Company Credit Score Modal */}
      {selectedCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-xl rounded-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto border shadow-2xl"
            style={{ backgroundColor: PANEL, borderColor: BORDER }}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b pb-4" style={{ borderColor: BORDER }}>
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shrink-0"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {selectedCompanyModal.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold" style={{ color: TEXT, fontFamily: SERIF }}>
                      {selectedCompanyModal.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                      {selectedCompanyModal.scale}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: SUBTLE }}>
                    {selectedCompanyModal.category} • GSTIN: {selectedCompanyModal.gstin}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCompanyModal(null)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold p-1 rounded-lg hover:bg-black/5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Score & Risk Assessment Banner */}
            <div
              className="p-4 rounded-xl border flex items-center justify-between gap-4"
              style={{
                backgroundColor: getScoreColor(selectedCompanyModal.creditScore).bg,
                borderColor: getScoreColor(selectedCompanyModal.creditScore).border,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white shadow-xs">
                  <ShieldCheck size={28} style={{ color: getScoreColor(selectedCompanyModal.creditScore).text }} />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: getScoreColor(selectedCompanyModal.creditScore).text }}>
                    CollectIQ Verified Trust Rating
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black font-mono" style={{ color: getScoreColor(selectedCompanyModal.creditScore).text }}>
                      {selectedCompanyModal.creditScore}
                      <span className="text-xs font-normal opacity-70"> /900</span>
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white shadow-2xs" style={{ color: getScoreColor(selectedCompanyModal.creditScore).text }}>
                      {selectedCompanyModal.creditTier} Tier
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-gray-700 block">
                  On-Time Settlements
                </span>
                <span className="text-lg font-bold font-mono text-emerald-800">
                  {selectedCompanyModal.onTimePaymentRate}%
                </span>
              </div>
            </div>

            {/* Aggregated Exposure Breakdown (Strictly Privacy Protected) */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: SUBTLE }}>
                  Overall Financial Position & Market Balance
                </h4>
                <span className="text-[11px] flex items-center gap-1 font-medium" style={{ color: PRIMARY }}>
                  <Lock size={11} /> 0 Private Invoices Leaked
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border" style={{ backgroundColor: CANVAS, borderColor: BORDER }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium" style={{ color: SUBTLE }}>
                    Pending To Pay (Market)
                  </span>
                  <span className="text-sm sm:text-base font-bold font-mono text-gray-900">
                    {money(selectedCompanyModal.totalMarketPayables)}
                  </span>
                  <span className="text-[11px] text-amber-800">
                    {selectedCompanyModal.overduePayables > 0 ? `₹${selectedCompanyModal.overduePayables.toLocaleString("en-IN")} overdue` : "0 past due"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium" style={{ color: SUBTLE }}>
                    Market Credit Given
                  </span>
                  <span className="text-sm sm:text-base font-bold font-mono text-gray-900">
                    {money(selectedCompanyModal.totalMarketReceivables)}
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    Across {selectedCompanyModal.openReceivablesCount} trade orders
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1 flex flex-col gap-0.5 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:pl-3" style={{ borderColor: BORDER }}>
                  <span className="text-xs font-medium" style={{ color: SUBTLE }}>
                    Net Market Standing
                  </span>
                  <span
                    className={`text-sm sm:text-base font-bold font-mono ${
                      selectedCompanyModal.netMarketStanding >= 0 ? "text-emerald-800" : "text-amber-800"
                    }`}
                  >
                    {selectedCompanyModal.netMarketStanding >= 0
                      ? `+${money(selectedCompanyModal.netMarketStanding)}`
                      : `-${money(Math.abs(selectedCompanyModal.netMarketStanding))}`}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-600">
                    {selectedCompanyModal.netMarketStanding >= 0 ? "Extra Credit Surplus" : "Net Market Balance"}
                  </span>
                </div>
              </div>
            </div>

            {/* Company Contact & Location */}
            <div className="flex flex-col gap-2 p-3.5 rounded-xl border text-xs" style={{ backgroundColor: CANVAS, borderColor: BORDER }}>
              <div className="flex items-center gap-2" style={{ color: TEXT }}>
                <MapPin size={14} className="text-emerald-800 shrink-0" />
                <span>{selectedCompanyModal.address}</span>
              </div>
              <div className="flex items-center gap-2" style={{ color: TEXT }}>
                <Phone size={14} className="text-emerald-800 shrink-0" />
                <span>{selectedCompanyModal.phone} (Representative: {selectedCompanyModal.name})</span>
              </div>
              <div className="flex items-center gap-2" style={{ color: TEXT }}>
                <Mail size={14} className="text-emerald-800 shrink-0" />
                <span>{selectedCompanyModal.email}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: BORDER }}>
              <button
                type="button"
                onClick={() => setSelectedCompanyModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border transition-all hover:bg-black/5 cursor-pointer"
                style={{ borderColor: BORDER, color: TEXT }}
              >
                Close
              </button>
              {onSelectCompany && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectCompany(selectedCompanyModal.id);
                    setSelectedCompanyModal(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-white transition-opacity active:opacity-90 shadow-sm cursor-pointer"
                  style={{ backgroundColor: PRIMARY }}
                >
                  View Counterparty Invoices
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
