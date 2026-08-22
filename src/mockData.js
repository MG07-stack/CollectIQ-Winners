export const CUSTOMERS_LIST = [
  { id: "CUST001", name: "Sharma Traders", agent: "agent1", address: "Plot 42, Industrial Area Phase II, Gurugram, Haryana", phone: "+91 98765 43210" },
  { id: "CUST002", name: "Tata Consultancy Services", agent: "agent1", address: "TCS House, Raveline Street, Fort, Mumbai", phone: "+91 98200 11223" },
  { id: "CUST003", name: "Reliance Digital", agent: "agent1", address: "Maker Chambers IV, 3rd Floor, Nariman Point, Mumbai", phone: "+91 98211 44556" },
  { id: "CUST004", name: "Infosys Technologies", agent: "agent1", address: "Electronics City, Hosur Road, Bengaluru", phone: "+91 98450 77889" },
  { id: "CUST005", name: "HDFC Enterprises", agent: "agent1", address: "HDFC House, Senapati Bapat Marg, Lower Parel, Mumbai", phone: "+91 98222 33445" },
  { id: "CUST006", name: "Mahindra Logistics", agent: "agent1", address: "Mahindra Towers, P.K. Kurne Chowk, Worli, Mumbai", phone: "+91 98333 55667" },
  { id: "CUST007", name: "Wipro Solutions", agent: "agent1", address: "Doddakannelli, Sarjapur Road, Bengaluru", phone: "+91 98444 66778" },
  { id: "CUST008", name: "Adani Power", agent: "agent1", address: "Shantigram, S.G. Highway, Ahmedabad", phone: "+91 98555 88990" },
  { id: "CUST009", name: "Titan Company", agent: "agent1", address: "Integrity, 132/133, Hosur Main Road, Bengaluru", phone: "+91 98666 99001" },
  { id: "CUST010", name: "Zomato Media", agent: "agent2", address: "Ground Floor, Pioneer Square, Sector 62, Gurugram", phone: "+91 98777 00112" },
  { id: "CUST011", name: "Flipkart Logistics", agent: "agent2", address: "Buildings Alyssa, Begonia, Outer Ring Road, Bengaluru", phone: "+91 98888 11223" },
  { id: "CUST012", name: "Swiggy Technologies", agent: "agent2", address: "IBC Knowledge Park, Bannerghatta Main Road, Bengaluru", phone: "+91 98999 22334" },
  { id: "CUST013", name: "Airtel Business", agent: "agent2", address: "Airtel Centre, Plot 16, Udyog Vihar Phase IV, Gurugram", phone: "+91 98111 33445" },
  { id: "CUST014", name: "Bajaj Finance", agent: "agent2", address: "4th Floor, Bajaj Finserv Corporate Office, Pune", phone: "+91 98233 44556" },
  { id: "CUST015", name: "Ola Mobility", agent: "agent2", address: "Regent Insignia, Koramangala, Bengaluru", phone: "+91 98344 55667" },
  { id: "CUST016", name: "Paytm Payments", agent: "agent2", address: "Skymark One, Sector 98, Noida", phone: "+91 98455 66778" },
  { id: "CUST017", name: "Maruti Suzuki Supply", agent: "agent2", address: "1, Nelson Mandela Road, Vasant Kunj, New Delhi", phone: "+91 98566 77889" },
];

export const INDIAN_COMPANIES = CUSTOMERS_LIST.map((c) => ({ name: c.name, agent: c.agent, id: c.id }));

export function findCustomer(identifier) {
  if (!identifier) return null;
  const clean = String(identifier).trim().toLowerCase();
  return CUSTOMERS_LIST.find((c) =>
    c.id.toLowerCase() === clean ||
    c.name.toLowerCase() === clean ||
    c.name.toLowerCase().replace(/[^a-z0-9]/g, "-") === clean ||
    c.name.toLowerCase().replace(/\s+/g, "") === clean.replace(/\s+/g, "")
  ) || null;
}

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

const sharmaInvoices = [
  {
    id: "INV-IN-0901",
    customerId: "CUST001",
    customer: "Sharma Traders",
    assignedTo: "agent1",
    amount: 33000,
    status: "Outstanding",
    priority: "Medium",
    daysOverdue: 0,
    issued: "2026-08-01",
    due: "2026-08-31",
  },
  {
    id: "INV-IN-0902",
    customerId: "CUST001",
    customer: "Sharma Traders",
    assignedTo: "agent1",
    amount: 12000,
    status: "Overdue",
    priority: "High",
    daysOverdue: 18,
    issued: "2026-07-10",
    due: "2026-08-04",
  },
];

const generatedInvoices = Array.from({ length: 38 }).map((_, i) => {
  const companyObj = pick(INDIAN_COMPANIES.slice(1));
  const amount = Math.round((25000 + rnd() * 850000) / 1000) * 1000;
  const daysOverdue = Math.round(rnd() * rnd() * 95);
  const isPaid = rnd() < 0.22 && daysOverdue < 5;
  const status = isPaid ? "Paid" : daysOverdue > 0 ? (rnd() < 0.18 ? "Partially Paid" : "Overdue") : "Outstanding";
  const priority = status === "Paid" ? "Low" : priorityFor(daysOverdue, amount);
  const issued = new Date(2026, 4 + Math.floor(rnd() * 4), 1 + Math.floor(rnd() * 27));
  const due = new Date(issued.getTime() + 30 * 86400000);

  return {
    id: `INV-IN-${1000 + i}`,
    customerId: companyObj.id,
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

export const invoices = [...sharmaInvoices, ...generatedInvoices];

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
  { id: "v-100", customerId: "CUST001", customer: "Sharma Traders", outcome: "Contacted Customer", date: "2026-08-22", visit_time: "2026-08-22T22:30:00", agent: "agent1", amount: 0, notes: "Spoke with Mr. Sharma regarding overdue invoice INV-IN-0902." },
  { id: "v-101", customerId: "CUST002", customer: "Tata Consultancy Services", outcome: "Promised Payment", date: "2026-08-20", visit_time: "2026-08-20T14:15:00", agent: "agent1", amount: 450000, notes: "Spoke with Finance Lead. Payment scheduled by RTGS on Friday." },
  { id: "v-102", customerId: "CUST010", customer: "Zomato Media", outcome: "Collected Cash", date: "2026-08-21", visit_time: "2026-08-21T16:45:00", agent: "agent2", amount: 185000, notes: "Collected manager check on-site." },
  { id: "v-103", customerId: "CUST003", customer: "Reliance Digital", outcome: "Contacted Customer", date: "2026-08-22", visit_time: "2026-08-22T11:20:00", agent: "agent1", amount: 0, notes: "Met with procurement team regarding overdue invoice." },
];
