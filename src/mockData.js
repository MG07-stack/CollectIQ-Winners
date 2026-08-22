const INDIAN_COMPANIES = [
  { name: "Tata Consultancy Services", agent: "agent1" },
  { name: "Reliance Digital", agent: "agent1" },
  { name: "Infosys Technologies", agent: "agent1" },
  { name: "HDFC Enterprises", agent: "agent1" },
  { name: "Mahindra Logistics", agent: "agent1" },
  { name: "Wipro Solutions", agent: "agent1" },
  { name: "Adani Power", agent: "agent1" },
  { name: "Titan Company", agent: "agent1" },

  { name: "Zomato Media", agent: "agent2" },
  { name: "Flipkart Logistics", agent: "agent2" },
  { name: "Swiggy Technologies", agent: "agent2" },
  { name: "Airtel Business", agent: "agent2" },
  { name: "Bajaj Finance", agent: "agent2" },
  { name: "Ola Mobility", agent: "agent2" },
  { name: "Paytm Payments", agent: "agent2" },
  { name: "Maruti Suzuki Supply", agent: "agent2" },
];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const rnd = seededRandom(42);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

function priorityFor(daysOverdue, amount) {
  const score = daysOverdue * 1 + amount / 15000;
  if (daysOverdue > 45 || score > 70) return "High";
  if (daysOverdue > 15 || score > 30) return "Medium";
  return "Low";
}

export const STATUSES = ["Outstanding", "Partially Paid", "Overdue", "Paid"];

export const invoices = Array.from({ length: 40 }).map((_, i) => {
  const companyObj = pick(INDIAN_COMPANIES);
  const amount = Math.round((25000 + rnd() * 850000) / 1000) * 1000;
  const daysOverdue = Math.round(rnd() * rnd() * 95);
  const isPaid = rnd() < 0.22 && daysOverdue < 5;
  const status = isPaid ? "Paid" : daysOverdue > 0 ? (rnd() < 0.18 ? "Partially Paid" : "Overdue") : "Outstanding";
  const priority = status === "Paid" ? "Low" : priorityFor(daysOverdue, amount);
  const issued = new Date(2026, 4 + Math.floor(rnd() * 4), 1 + Math.floor(rnd() * 27));
  const due = new Date(issued.getTime() + 30 * 86400000);

  return {
    id: `INV-IN-${1000 + i}`,
    customer: companyObj.name,
    assignedTo: companyObj.agent,
    amount,
    status,
    priority,
    daysOverdue: status === "Paid" ? 0 : daysOverdue,
    issued: issued.toISOString().slice(0, 10),
    due: due.toISOString().slice(0, 10),
  };
});

export const trendData = [
  { month: "Mar", outstanding: 1850000, overdue: 420000 },
  { month: "Apr", outstanding: 2100000, overdue: 580000 },
  { month: "May", outstanding: 2450000, overdue: 690000 },
  { month: "Jun", outstanding: 2300000, overdue: 810000 },
  { month: "Jul", outstanding: 2680000, overdue: 950000 },
  { month: "Aug", outstanding: 2950000, overdue: 1120000 },
];

export const agingBuckets = [
  { key: "0-30", label: "0–30 days", test: (d) => d <= 30 },
  { key: "31-60", label: "31–60 days", test: (d) => d > 30 && d <= 60 },
  { key: "61-90", label: "61–90 days", test: (d) => d > 60 && d <= 90 },
  { key: "90+", label: "90+ days", test: (d) => d > 90 },
];

export const mockVisits = [
  { id: "v-101", customer: "Tata Consultancy Services", outcome: "Promised Payment", date: "2026-08-20", agent: "agent1", amount: 450000, notes: "Spoke with Finance Lead. Payment scheduled by RTGS on Friday." },
  { id: "v-102", customer: "Zomato Media", outcome: "Collected Cash", date: "2026-08-21", agent: "agent2", amount: 185000, notes: "Collected manager check on-site." },
  { id: "v-103", customer: "Reliance Digital", outcome: "Contacted Customer", date: "2026-08-22", agent: "agent1", amount: 0, notes: "Met with procurement team regarding overdue invoice." },
];
