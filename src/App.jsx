import React, { useState } from "react";
import { Wallet, Clock, AlertCircle, TrendingUp, ChevronRight } from "lucide-react";
import { CANVAS, TEXT, SUBTLE, PRIMARY, HIGH, SERIF, money } from "./theme.js";
import { invoices } from "./mockData.js";

import Sidebar from "./components/Sidebar.jsx";
import KpiCard from "./components/KpiCard.jsx";
import TrendChart from "./components/TrendChart.jsx";
import PriorityDonut from "./components/PriorityDonut.jsx";
import AgingMeter from "./components/AgingMeter.jsx";
import InvoiceTable from "./components/InvoiceTable.jsx";
import CustomerDashboard from "./components/CustomerDashboard.jsx";

export default function App() {
  const [tab, setTab] = useState("overview");

  const unpaid = invoices.filter((i) => i.status !== "Paid");
  const totalOutstanding = unpaid.reduce((s, i) => s + i.amount, 0);
  const overdue = unpaid.filter((i) => i.daysOverdue > 0);
  const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0);
  const highCount = unpaid.filter((i) => i.priority === "High").length;
  const paidCount = invoices.filter((i) => i.status === "Paid").length;
  const collectionRate = Math.round((paidCount / invoices.length) * 100);

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: CANVAS, fontFamily: "'Inter', sans-serif" }}>
      <Sidebar tab={tab} setTab={setTab} />

      <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-6xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: TEXT, fontFamily: SERIF }}>
            {tab === "overview" && "Collections overview"}
            {tab === "invoices" && "Invoices"}
            {tab === "customers" && "Customers"}
          </h1>
          <p className="text-sm mt-1" style={{ color: SUBTLE }}>
            {tab === "overview" && "Where the money is, and who needs a nudge today."}
            {tab === "invoices" && "Search, filter and triage every open invoice."}
            {tab === "customers" && "Outstanding balances grouped by customer."}
          </p>
        </header>

        {tab === "overview" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard icon={Wallet} label="Outstanding" value={money(totalOutstanding)} accent={PRIMARY} sub={`${unpaid.length} open invoices`} />
              <KpiCard icon={Clock} label="Overdue" value={money(totalOverdue)} accent={HIGH} sub={`${overdue.length} past due`} />
              <KpiCard icon={AlertCircle} label="High priority" value={highCount} accent={HIGH} sub="need action today" />
              <KpiCard icon={TrendingUp} label="Collection rate" value={`${collectionRate}%`} accent={PRIMARY} sub="of invoices paid" />
            </div>
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2"><TrendChart /></div>
              <PriorityDonut invoices={invoices} />
            </div>
            <AgingMeter invoices={invoices} />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: TEXT }}>High priority invoices</h3>
                <button onClick={() => setTab("invoices")} className="text-xs font-medium flex items-center gap-1" style={{ color: PRIMARY }}>
                  View all <ChevronRight size={13} />
                </button>
              </div>
              <InvoiceTable invoices={invoices.filter((i) => i.priority === "High" && i.status !== "Paid").slice(0, 6)} />
            </div>
          </div>
        )}

        {tab === "invoices" && <InvoiceTable invoices={invoices} />}
        {tab === "customers" && <CustomerDashboard invoices={invoices} />}
      </main>
    </div>
  );
}
