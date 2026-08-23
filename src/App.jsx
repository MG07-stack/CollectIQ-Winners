import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Clock,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Wifi,
  CheckCircle2,
  User,
  LogOut,
  RefreshCw,
} from "lucide-react";
import {
  CANVAS,
  PANEL,
  BORDER,
  TEXT,
  SUBTLE,
  PRIMARY,
  PRIMARY_SOFT,
  HIGH,
  MONO,
  SERIF,
  money,
} from "./theme.js";
import { getInvoices, getVisits, postVisit, getMe, logout as apiLogout } from "./api.js";

import Login from "./components/Login.jsx";
import Sidebar from "./components/Sidebar.jsx";
import KpiCard from "./components/KpiCard.jsx";
import TrendChart from "./components/TrendChart.jsx";
import PriorityDonut from "./components/PriorityDonut.jsx";
import AgingMeter from "./components/AgingMeter.jsx";
import InvoiceTable from "./components/InvoiceTable.jsx";
import CustomerDashboard from "./components/CustomerDashboard.jsx";
import FieldVisit from "./components/FieldVisit.jsx";
import VisitLog from "./components/VisitLog.jsx";
import CustomerProfile from "./components/CustomerProfile.jsx";
import NfcProgrammerModal from "./components/NfcProgrammerModal.jsx";
import CompanySearch from "./components/CompanySearch.jsx";

const SESSION_KEY = "collectiq_session";

export default function App() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("overview");
  const [invoices, setInvoices] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [routeCustomerId, setRouteCustomerId] = useState(null);
  const [pendingNfcCustomer, setPendingNfcCustomer] = useState(null);
  const [nfcModalOpen, setNfcModalOpen] = useState(false);

  // Parse URL path for /customer/:customerId
  const checkUrlRoute = useCallback(() => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    const match =
      pathname.match(/^\/customer\/([^\/\?]+)/i) ||
      hash.match(/^#\/customer\/([^\/\?]+)/i);

    if (match && match[1]) {
      const custId = decodeURIComponent(match[1]);
      setRouteCustomerId(custId);
      // If not yet authenticated, save as pending NFC destination
      setPendingNfcCustomer(custId);
    } else {
      setRouteCustomerId(null);
    }
  }, []);

  // Restore session from localStorage & validate
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.token && parsed?.user) {
          setSession(parsed);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    checkUrlRoute();
  }, [checkUrlRoute]);

  // Route event listeners
  useEffect(() => {
    window.addEventListener("popstate", checkUrlRoute);
    window.addEventListener("hashchange", checkUrlRoute);
    return () => {
      window.removeEventListener("popstate", checkUrlRoute);
      window.removeEventListener("hashchange", checkUrlRoute);
    };
  }, [checkUrlRoute]);

  // Fetch user data on valid session
  useEffect(() => {
    if (!session?.token) return;
    loadData(session.token);
  }, [session?.token]);

  async function loadData(token) {
    setLoading(true);
    setLoadError("");
    try {
      const [invoiceData, visitData] = await Promise.all([
        getInvoices(token),
        getVisits(token),
      ]);
      setInvoices(invoiceData || []);
      setVisits(visitData || []);
    } catch (err) {
      if (err.status === 401) {
        handleLogout();
      } else {
        setLoadError(err.message || "Couldn't load data from backend server.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(token, user, rememberMe = true) {
    const newSession = { token, user };
    setSession(newSession);

    if (rememberMe) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    }

    // If a customer profile was tapped before login, navigate to it now
    if (pendingNfcCustomer) {
      setRouteCustomerId(pendingNfcCustomer);
      window.history.pushState(null, "", `/customer/${pendingNfcCustomer}`);
    } else {
      window.history.pushState(null, "", "/");
      setRouteCustomerId(null);
    }
  }

  async function handleLogout() {
    if (session?.token) {
      await apiLogout(session.token);
    }
    setSession(null);
    setInvoices([]);
    setVisits([]);
    setPendingNfcCustomer(null);
    setRouteCustomerId(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    window.history.pushState(null, "", "/");
  }

  async function handleRecordVisit(visit) {
    try {
      await postVisit(session?.token, {
        ...visit,
        agent: session?.user?.full_name || session?.user?.name || "Field Agent",
      });
      if (session?.token) await loadData(session.token);
    } catch (err) {
      setLoadError(err.message || "Couldn't save field visit.");
    }
  }

  function navigateToCustomer(customerId) {
    window.history.pushState(null, "", `/customer/${customerId}`);
    setRouteCustomerId(customerId);
  }

  function handleBackToDashboard() {
    window.history.pushState(null, "", "/");
    setRouteCustomerId(null);
    setPendingNfcCustomer(null);
    setTab("overview");
    if (session?.token) loadData(session.token);
  }

  function handleVisitLogged() {
    if (session?.token) loadData(session.token);
  }

  // If unauthenticated, render Login / Register page
  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  // Active /customer/:customerId Route View (Protected NFC Tap Destination)
  if (routeCustomerId) {
    return (
      <CustomerProfile
        customerId={routeCustomerId}
        token={session.token}
        user={session.user}
        onBack={handleBackToDashboard}
        onVisitLogged={handleVisitLogged}
      />
    );
  }

  const receivables = invoices.filter((i) => i.direction === "RECEIVABLE" || !i.direction);
  const payables = invoices.filter((i) => i.direction === "PAYABLE");

  const unpaidReceivables = receivables.filter((i) => i.status !== "Paid");
  const unpaidPayables = payables.filter((i) => i.status !== "Paid");

  const totalReceivables = unpaidReceivables.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalPayables = unpaidPayables.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const netMarketStanding = totalReceivables - totalPayables;

  const overdueRec = unpaidReceivables.filter((i) => i.daysOverdue > 0);
  const totalOverdueRec = overdueRec.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const highCount = unpaidReceivables.filter((i) => i.priority === "High").length;
  const paidCount = receivables.filter((i) => i.status === "Paid").length;
  const collectionRate =
    receivables.length > 0 ? Math.round((paidCount / receivables.length) * 100) : 0;

  const userTrustScore = session.user?.creditScore || 820;

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row w-full overflow-x-hidden"
      style={{ backgroundColor: CANVAS, fontFamily: "'Inter', sans-serif" }}
    >
      <Sidebar
        tab={tab}
        setTab={setTab}
        user={session.user}
        onLogout={handleLogout}
      />

      <main className="flex-1 px-3.5 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 max-w-6xl w-full">
        {/* Top Header */}
        <header className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1
              className="text-xl sm:text-2xl font-semibold tracking-tight"
              style={{ color: TEXT, fontFamily: SERIF }}
            >
              {tab === "overview" && "Financial & Cash Flow Overview"}
              {tab === "invoices" && "Invoices & Transactions"}
              {tab === "customers" && "Counterparty Directory"}
              {tab === "directory" && "B2B Credit Directory"}
              {tab === "visits" && "Field Audit & Visits"}
            </h1>
            <p className="text-xs sm:text-sm mt-0.5 sm:mt-1" style={{ color: SUBTLE }}>
              {tab === "overview" && "Real-time receivables to receive, payables to pay, and net market liquidity."}
              {tab === "invoices" && "Triage all inward receivables and outward payables."}
              {tab === "customers" && "Balances grouped by customer and supplier counterparties."}
              {tab === "directory" && "Search any Indian company's CollectIQ Trust Score and total market balance."}
              {tab === "visits" && "Record field audit visits and on-site payments."}
            </p>
          </div>

          {/* Quick NFC Programmer Button & Refresh */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(session.token)}
              disabled={loading}
              className="p-2 rounded-xl border transition-all hover:bg-black/5 active:scale-95 shadow-xs cursor-pointer"
              style={{ borderColor: BORDER, color: SUBTLE, backgroundColor: PANEL }}
              title="Refresh dashboard data"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-emerald-800" : ""} />
            </button>

            <button
              onClick={() => setNfcModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all hover:bg-black/5 active:scale-95 shadow-xs cursor-pointer"
              style={{ borderColor: PRIMARY, color: PRIMARY, backgroundColor: PRIMARY_SOFT }}
            >
              <Wifi size={14} />
              <span>NFC Card Guide</span>
            </button>
          </div>
        </header>

        {loadError && (
          <div
            className="mb-4 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2"
            style={{ backgroundColor: "#F6E4E1", color: "#B23A2F" }}
          >
            <span>{loadError}</span>
            <button
              onClick={() => loadData(session.token)}
              className="font-semibold underline cursor-pointer text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {loading && invoices.length === 0 ? (
          <div className="text-xs sm:text-sm py-16 text-center" style={{ color: SUBTLE }}>
            Loading your financial network data...
          </div>
        ) : (
          <>
            {tab === "overview" && (
              <div className="flex flex-col gap-4 sm:gap-5">
                {/* 4 Enhanced KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  <KpiCard
                    icon={Wallet}
                    label="To Receive (Receivables)"
                    value={money(totalReceivables)}
                    accent={PRIMARY}
                    sub={`${unpaidReceivables.length} open receivables`}
                  />
                  <KpiCard
                    icon={Clock}
                    label="To Pay (Payables)"
                    value={money(totalPayables)}
                    accent="#B45309"
                    sub={`${unpaidPayables.length} open bills`}
                  />
                  <KpiCard
                    icon={TrendingUp}
                    label="Net Market Standing"
                    value={
                      netMarketStanding >= 0
                        ? `+${money(netMarketStanding)}`
                        : `-${money(Math.abs(netMarketStanding))}`
                    }
                    accent={netMarketStanding >= 0 ? PRIMARY : HIGH}
                    sub={netMarketStanding >= 0 ? "Surplus liquidity" : "Net pending debt"}
                  />
                  <KpiCard
                    icon={AlertCircle}
                    label="Trust Rating"
                    value={`${userTrustScore} /900`}
                    accent={PRIMARY}
                    sub={`${collectionRate}% on-time rate`}
                  />
                </div>

                <div className="grid lg:grid-cols-3 gap-3.5 sm:gap-4">
                  <div className="lg:col-span-2">
                    <TrendChart />
                  </div>
                  <PriorityDonut invoices={invoices} />
                </div>

                <AgingMeter invoices={invoices} />

                {/* Recent Collection & NFC Activity Section */}
                <div
                  className="rounded-2xl p-4 sm:p-5 border shadow-xs"
                  style={{ backgroundColor: PANEL, borderColor: BORDER }}
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <CheckCircle2 size={14} />
                      </div>
                      <h3
                        className="text-xs sm:text-sm font-semibold"
                        style={{ color: TEXT }}
                      >
                        Recent Network Settlements & NFC Activity
                      </h3>
                    </div>

                    <button
                      onClick={() => setTab("visits")}
                      className="text-xs font-medium flex items-center gap-1 hover:underline cursor-pointer"
                      style={{ color: PRIMARY }}
                    >
                      View visit log <ChevronRight size={13} />
                    </button>
                  </div>

                  {visits.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {visits.slice(0, 3).map((v) => (
                        <div
                          key={v.id}
                          onClick={() => {
                            if (v.customerId) navigateToCustomer(v.customerId);
                          }}
                          className="rounded-xl p-3 flex flex-col justify-between gap-2 border transition-colors hover:border-emerald-700/40 cursor-pointer"
                          style={{ backgroundColor: CANVAS, borderColor: BORDER }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <span
                                className="font-semibold text-xs sm:text-sm truncate block"
                                style={{ color: TEXT }}
                              >
                                {v.customer}
                              </span>
                              <span className="text-[11px] text-emerald-800 font-medium flex items-center gap-1 mt-0.5">
                                <CheckCircle2 size={11} /> {v.outcome || "Visit recorded"}
                              </span>
                            </div>
                            <span
                              className="text-[10px] font-mono shrink-0"
                              style={{ color: SUBTLE }}
                            >
                              {v.date || "Just now"}
                            </span>
                          </div>

                          <div
                            className="flex items-center justify-between text-[11px] pt-1.5 border-t"
                            style={{ borderColor: BORDER, color: SUBTLE }}
                          >
                            <span className="flex items-center gap-1">
                              <User size={11} /> {v.agent || "Representative"}
                            </span>
                            {v.amount > 0 && (
                              <span className="font-bold font-mono text-gray-800">
                                {money(v.amount)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="text-xs text-center py-4"
                      style={{ color: SUBTLE }}
                    >
                      No collection visits recorded yet. Tap an NFC card to log a visit.
                    </div>
                  )}
                </div>

                {/* High Priority Invoices Table */}
                <div>
                  <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                    <h3
                      className="text-xs sm:text-sm font-semibold"
                      style={{ color: TEXT }}
                    >
                      High priority pending invoices
                    </h3>
                    <button
                      onClick={() => setTab("invoices")}
                      className="text-xs font-medium flex items-center gap-1 hover:underline cursor-pointer"
                      style={{ color: PRIMARY }}
                    >
                      View all <ChevronRight size={13} />
                    </button>
                  </div>
                  <InvoiceTable
                    invoices={invoices
                      .filter((i) => i.priority === "High" && i.status !== "Paid")
                      .slice(0, 6)}
                  />
                </div>
              </div>
            )}

            {tab === "invoices" && <InvoiceTable invoices={invoices} />}
            {tab === "customers" && (
              <CustomerDashboard
                invoices={invoices}
                onSelectCustomer={navigateToCustomer}
                onOpenNfcProgrammer={() => setNfcModalOpen(true)}
              />
            )}
            {tab === "directory" && (
              <CompanySearch
                token={session.token}
                onSelectCompany={navigateToCustomer}
              />
            )}

            {tab === "visits" && (
              <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
                <FieldVisit
                  invoices={invoices}
                  onRecordVisit={handleRecordVisit}
                />
                <div>
                  <h3
                    className="text-xs sm:text-sm font-semibold mb-2.5 sm:mb-3"
                    style={{ color: TEXT }}
                  >
                    Visit history log
                  </h3>
                  <VisitLog visits={visits} />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Developer NFC Programmer & Demo Modal */}
      <NfcProgrammerModal
        isOpen={nfcModalOpen}
        onClose={() => setNfcModalOpen(false)}
        onSimulateTap={navigateToCustomer}
      />
    </div>
  );
}
