import { invoices as initialInvoices, mockVisits as initialVisits } from "../src/mockData.js";

// In-memory data store
let invoicesStore = [...initialInvoices];
let visitsStore = [...initialVisits];

const DEMO_USERS = {
  admin: { id: "u1", username: "admin", name: "Sarah Connor (Admin)", role: "Admin", token: "tok_admin_12345" },
  agent1: { id: "u2", username: "agent1", name: "Alex Rivera (Agent 1)", role: "Field Agent", token: "tok_agent1_12345" },
  agent2: { id: "u3", username: "agent2", name: "Marcus Vance (Agent 2)", role: "Field Agent", token: "tok_agent2_12345" },
};

function parseJsonBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch { resolve({}); }
    });
  });
}

function getUserFromToken(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader) return DEMO_USERS.admin; // default if not passed
  const token = authHeader.replace("Bearer ", "").trim();
  const user = Object.values(DEMO_USERS).find((u) => u.token === token);
  return user || DEMO_USERS.admin;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname.replace(/\/$/, "");
  const currentUser = getUserFromToken(req);

  // Authentication: POST /api/auth/login
  if (req.method === "POST" && (pathname === "/api/auth/login" || pathname === "/auth/login")) {
    const body = await parseJsonBody(req);
    const user = DEMO_USERS[body?.username?.toLowerCase()];
    if (user && body?.password === `${user.username}123`) {
      return res.status(200).json({ token: user.token, user });
    }
    return res.status(401).json({ error: "Invalid username or password. Demo credentials: admin / admin123, agent1 / agent123, agent2 / agent123" });
  }

  // Helper to filter invoices for the current logged in user
  const userInvoices = currentUser.role === "Admin"
    ? invoicesStore
    : invoicesStore.filter((i) => i.assignedTo === currentUser.username);

  // Get Invoices: GET /api/invoices
  if (req.method === "GET" && (pathname === "/api/invoices" || pathname === "/invoices")) {
    return res.status(200).json(userInvoices);
  }

  // Get Customers: GET /api/customers
  if (req.method === "GET" && (pathname === "/api/customers" || pathname === "/customers")) {
    const map = {};
    userInvoices.forEach((inv) => {
      if (!map[inv.customer]) map[inv.customer] = { name: inv.customer, invoices: [], outstanding: 0, high: 0 };
      map[inv.customer].invoices.push(inv);
      if (inv.status !== "Paid") map[inv.customer].outstanding += inv.amount;
      if (inv.priority === "High" && inv.status !== "Paid") map[inv.customer].high += 1;
    });
    return res.status(200).json(Object.values(map));
  }

  // NFC Lookup: GET /api/nfc/lookup
  if (req.method === "GET" && (pathname === "/api/nfc/lookup" || pathname === "/nfc/lookup")) {
    const tagId = url.searchParams.get("tagId") || url.searchParams.get("id");
    const inv = userInvoices.find((i) => i.status !== "Paid");
    return res.status(200).json({ tagId, customer: inv?.customer || "Tata Consultancy Services", invoice: inv || null });
  }

  // Get Visits: GET /api/visits
  if (req.method === "GET" && (pathname === "/api/visits" || pathname === "/visits")) {
    const userVisits = currentUser.role === "Admin"
      ? visitsStore
      : visitsStore.filter((v) => v.agent === currentUser.username || v.agent === currentUser.name);
    return res.status(200).json(userVisits);
  }

  // Post Visit: POST /api/visits
  if (req.method === "POST" && (pathname === "/api/visits" || pathname === "/visits")) {
    const body = await parseJsonBody(req);
    const visitAmount = Number(body.amount) || 0;
    const newVisit = {
      id: `v-${Date.now()}`,
      customer: body.customer || "Unknown",
      outcome: body.outcome || "Contacted",
      date: new Date().toISOString().split("T")[0],
      agent: currentUser.name || currentUser.username,
      amount: visitAmount,
      notes: body.notes || "",
    };

    visitsStore.unshift(newVisit);

    if (body.invoiceId) {
      invoicesStore = invoicesStore.map((inv) => {
        if (inv.id !== body.invoiceId) return inv;
        if (body.outcome === "Collected Cash") {
          if (visitAmount >= inv.amount) {
            return { ...inv, status: "Paid", priority: "Low", daysOverdue: 0 };
          } else {
            return { ...inv, status: "Partially Paid", amount: Math.max(0, inv.amount - visitAmount) };
          }
        }
        if (body.outcome === "Promised Payment" && inv.status === "Overdue") {
          return { ...inv, status: "Partially Paid" };
        }
        return inv;
      });
    }

    return res.status(201).json(newVisit);
  }

  // Dashboard Summary: GET /api/dashboard/summary
  if (req.method === "GET" && (pathname === "/api/dashboard/summary" || pathname === "/dashboard/summary")) {
    const unpaid = userInvoices.filter((i) => i.status !== "Paid");
    const totalOutstanding = unpaid.reduce((s, i) => s + i.amount, 0);
    const overdue = unpaid.filter((i) => i.daysOverdue > 0);
    const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0);
    const highCount = unpaid.filter((i) => i.priority === "High").length;
    const paidCount = userInvoices.filter((i) => i.status === "Paid").length;

    return res.status(200).json({
      totalOutstanding,
      totalOverdue,
      highPriorityCount: highCount,
      collectionRate: userInvoices.length ? Math.round((paidCount / userInvoices.length) * 100) : 0,
      openInvoiceCount: unpaid.length,
    });
  }

  return res.status(404).json({ error: "Endpoint not found" });
}
