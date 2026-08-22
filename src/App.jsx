import React, { useState, useEffect, useCallback } from "react";
import { Wallet, Clock, AlertCircle, TrendingUp, ChevronRight, Wifi, CheckCircle2, ShieldCheck, User } from "lucide-react";
import { CANVAS, PANEL, BORDER, TEXT, SUBTLE, PRIMARY, PRIMARY_SOFT, HIGH, MONO, SERIF, money } from "./theme.js";
import { getInvoices, getVisits, postVisit } from "./api.js";

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

const SESSION_KEY = "collectiq_session";

export default function App() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("overview");
  const [invoices, setInvoices] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [routeCustomerId, setRouteCustomerId] = useState(null);
  const [nfcModalOpen, setNfcModalOpen] = useState(false);

  // Parse URL path for /customer/:customerId
  const checkUrlRoute = useCallback(() => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    const match = pathname.match(/^\/customer\/([^\/\?]+)/i) || hash.match(/^#\/customer\/([^\/\?]+)/i);

    if (match && match[1]) {
      setRouteCustomerId(decodeURIComponent(match[1]));
    } else {
      setRouteCustomerId(null);
    }
  }, []);

  // Restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        setSession(JSON.parse(saved));
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

  // Fetch data on valid session
  useEffect(() => {
    if (!session) return;
    loadData(session.token);
  }, [session]);

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
      setLoadError(err.message || "Couldn't load data from backend server.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(token, user) {
    const newSession = { token, user };
    setSession(newSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  }

  function handleLogout() {
    setSession(null);
    setInvoices([]);
    setVisits([]);
    localStorage.removeItem(SESSION_KEY);
  }

  async function handleRecordVisit(visit) {
    try {
      await postVisit(session?.token, {
        ...visit,
        agent: session?.user?.name || session?.user?.username || "Field Agent",
      });
      if (session) await loadData(session.token);
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
    setTab("overview");
    if (session) loadData(session.token);
  }

  function handleVisitLogged(newVisit) {
    if (session) loadData(session.token);
  }

  // Active /customer/:customerId Route View (NFC Tap Destination)
  if (routeCustomerId) {
    return (
      <CustomerProfile
        customerId={routeCustomerId}
        token={session?.token || "tok_agent1_12345"}
        user={session?.user || { username: "agent1", name: "Alex Rivera (Agent 1)" }}
        onBack={handleBackToDashboard}
        onVisitLogged={handleVisitLogged}
      />
    );
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  const unpaid = invoices.filter((i) => i.status !== "Paid");
  const totalOutstanding = unpaid.reduce((s, i) => s + i.amount, 0);
  const overdue = unpaid.filter((i) => i.daysOverdue > 0);
  const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0);
  const highCount = unpaid.filter((i) => i.priority === "High").length;
  const paidCount = invoices.filter((i) => i.status === "Paid").length;
  const collectionRate = invoices.length > 0 ? Math.round((paidCount / invoices.length) * 100) : 0;

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row w-full overflow-x-hidden"
      style={{ backgroundColor: CANVAS, fontFamily: "'Inter', sans-serif" }}
    >
      <Sidebar tab={tab} setTab={setTab} user={session.user} onLogout={handleLogout} />

      <main className="flex-1 px-3.5 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 max-w-6xl w-full">
        <header className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: TEXT, fontFamily: SERIF }}>
              {tab === "overview" && "Collections overview"}
              {tab === "invoices" && "Invoices"}
              {tab === "customers" && "Customers"}
              {tab === "visits" && "Field Visits"}
            </h1>
            <p className="text-xs sm:text-sm mt-0.5 sm:mt-1" style={{ color: SUBTLE }}>
              {tab === "overview" && "Where the money is, and who needs a nudge today."}
              {tab === "invoices" && "Search, filter and triage every open invoice."}
              {tab === "customers" && "Outstanding balances grouped by customer."}
              {tab === "visits" && "Record field audit visits and cash collections."}
            </p>
          </div>

          {/* Quick NFC Programmer Button */}
          <div className="flex items-center gap-2">
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
          <div className="mb-4 text-xs sm:text-sm rounded-lg px-3 py-2" style={{ backgroundColor: "#F6E4E1", color: "#B23A2F" }}>
            {loadError}
          </div>
        )}

        {loading && invoices.length === 0 ? (
          <div className="text-xs sm:text-sm py-10 text-center" style={{ color: SUBTLE }}>
            Loading dashboard data...
          </div>
        ) : (
          <>
            {tab === "overview" && (
              <div className="flex flex-col gap-4 sm:gap-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  <KpiCard icon={Wallet} label="Outstanding" value={money(totalOutstanding)} accent={PRIMARY} sub={`${unpaid.length} open invoices`} />
                  <KpiCard icon={Clock} label="Overdue" value={money(totalOverdue)} accent={HIGH} sub={`${overdue.length} past due`} />
                  <KpiCard icon={AlertCircle} label="High priority" value={highCount} accent={HIGH} sub="need action today" />
                  <KpiCard icon={TrendingUp} label="Collection rate" value={`${collectionRate}%`} accent={PRIMARY} sub="of invoices paid" />
                </div>

                <div className="grid lg:grid-cols-3 gap-3.5 sm:gap-4">
                  <div className="lg:col-span-2"><TrendChart /></div>
                  <PriorityDonut invoices={invoices} />
                </div>

                <AgingMeter invoices={invoices} />

                {/* Recent Collection & NFC Activity Section */}
                <div className="rounded-2xl p-4 sm:p-5 border shadow-xs" style={{ backgroundColor: PANEL, borderColor: BORDER }}>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <CheckCircle2 size={14} />
                      </div>
                      <h3 className="text-xs sm:text-sm font-semibold" style={{ color: TEXT }}>
                        Recent Collection & NFC Activity
                      </h3>
                    </div>

                    <button
                      onClick={() => setTab("visits")}
                      className="text-xs font-medium flex items-center gap-1 hover:underline"
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
                              <span className="font-semibold text-xs sm:text-sm truncate block" style={{ color: TEXT }}>
                                {v.customer}
                              </span>
                              <span className="text-[11px] text-emerald-800 font-medium flex items-center gap-1 mt-0.5">
                                <CheckCircle2 size={11} /> {v.outcome || "Visit recorded"}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono shrink-0" style={{ color: SUBTLE }}>
                              {v.date || "Just now"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t" style={{ borderColor: BORDER, color: SUBTLE }}>
                            <span className="flex items-center gap-1">
                              <User size={11} /> {v.agent || "Field Agent"}
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
                    <div className="text-xs text-center py-4" style={{ color: SUBTLE }}>
                      No recent collection visits recorded today. Tap an NFC card to log a visit.
                    </div>
                  )}
                </div>

                {/* High Priority Invoices Table */}
                <div>
                  <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                    <h3 className="text-xs sm:text-sm font-semibold" style={{ color: TEXT }}>High priority invoices</h3>
                    <button onClick={() => setTab("invoices")} className="text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: PRIMARY }}>
                      View all <ChevronRight size={13} />
                    </button>
                  </div>
                  <InvoiceTable invoices={invoices.filter((i) => i.priority === "High" && i.status !== "Paid").slice(0, 6)} />
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

            {tab === "visits" && (
              <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
                <FieldVisit invoices={invoices} onRecordVisit={handleRecordVisit} />
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold mb-2.5 sm:mb-3" style={{ color: TEXT }}>Visit history log</h3>
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

