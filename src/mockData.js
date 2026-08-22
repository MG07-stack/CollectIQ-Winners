const CUSTOMER_NAMES = [
  "Anchor Freight Co.", "Bellwood Textiles", "Cinder Logistics", "Dunmore Supply",
  "Elkhart Manufacturing", "Fairview Foods", "Granite Retail Group", "Harlow Industrial",
  "Ironclad Fabrication", "Juniper Media", "Kestrel Analytics", "Lattice Components",
  "Meridian Hardware", "Norton Chemical", "Oakridge Distribution", "Prairie Systems",
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
  const score = daysOverdue * 1 + amount / 500;
  if (daysOverdue > 45 || score > 90) return "High";
  if (daysOverdue > 15 || score > 40) return "Medium";
  return "Low";
}

export const STATUSES = ["Outstanding", "Partially Paid", "Overdue", "Paid"];

export const invoices = Array.from({ length: 42 }).map((_, i) => {
  const customer = pick(CUSTOMER_NAMES);
  const amount = Math.round((300 + rnd() * 9700) / 10) * 10;
  const daysOverdue = Math.round(rnd() * rnd() * 95);
  const isPaid = rnd() < 0.22 && daysOverdue < 5;
  const status = isPaid ? "Paid" : daysOverdue > 0 ? (rnd() < 0.15 ? "Partially Paid" : "Overdue") : "Outstanding";
  const priority = status === "Paid" ? "Low" : priorityFor(daysOverdue, amount);
  const issued = new Date(2026, 4 + Math.floor(rnd() * 4), 1 + Math.floor(rnd() * 27));
  const due = new Date(issued.getTime() + 30 * 86400000);
  return {
    id: `INV-${1000 + i}`,
    customer,
    amount,
    status,
    priority,
    daysOverdue: status === "Paid" ? 0 : daysOverdue,
    issued: issued.toISOString().slice(0, 10),
    due: due.toISOString().slice(0, 10),
  };
});

export const trendData = [
  { month: "Mar", outstanding: 42000, overdue: 11200 },
  { month: "Apr", outstanding: 46500, overdue: 13800 },
  { month: "May", outstanding: 51200, overdue: 15600 },
  { month: "Jun", outstanding: 48900, overdue: 19200 },
  { month: "Jul", outstanding: 53400, overdue: 21100 },
  { month: "Aug", outstanding: 57800, overdue: 24700 },
];

export const agingBuckets = [
  { key: "0-30", label: "0–30 days", test: (d) => d <= 30 },
  { key: "31-60", label: "31–60 days", test: (d) => d > 30 && d <= 60 },
  { key: "61-90", label: "61–90 days", test: (d) => d > 60 && d <= 90 },
  { key: "90+", label: "90+ days", test: (d) => d > 90 },
];
