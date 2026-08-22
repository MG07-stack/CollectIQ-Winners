import http from "node:http";
import { invoices as initialInvoices, mockVisits as initialVisits } from "./src/mockData.js";

const PORT = process.env.PORT || 5000;

// In-memory data store
let invoicesStore = [...initialInvoices];
let visitsStore = [...initialVisits];

const DEMO_USERS = {
  admin: { id: "u1", username: "admin", name: "Sarah Connor (Admin)", role: "Admin", token: "tok_admin_12345" },
  agent1: { id: "u2", username: "agent1", name: "Alex Rivera (Agent 1)", role: "Field Agent", token: "tok_agent1_12345" },
  agent2: { id: "u3", username: "agent2", name: "Marcus Vance (Agent 2)", role: "Field Agent", token: "tok_agent2_12345" },
};

let registeredUsers = { ...DEMO_USERS };

function parseJsonBody(req) {
  return new Promise((resolve) => {
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
  if (!authHeader) return registeredUsers.admin;
  const token = authHeader.replace("Bearer ", "").trim();
  const user = Object.values(registeredUsers).find((u) => u.token === token);
  return user || registeredUsers.admin;
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname.replace(/\/$/, "");

  // User Registration: POST /api/auth/register
  if (req.method === "POST" && (pathname === "/api/auth/register" || pathname === "/auth/register")) {
    const body = await parseJsonBody(req);
    const { username, password, name, role } = body;

    if (!username || !password) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Username and password are required." }));
    }

    const cleanUsername = username.trim().toLowerCase();
    if (registeredUsers[cleanUsername]) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Username is already taken. Please choose another." }));
    }

    const newUser = {
      id: `u_${Date.now()}`,
      username: cleanUsername,
      name: name?.trim() || cleanUsername,
      role: role || "Field Agent",
      token: `tok_${cleanUsername}_${Date.now()}`,
      password: password,
    };

    registeredUsers[cleanUsername] = newUser;

    // Seed 2 initial invoices for new field agents
    invoicesStore.push(
      {
        id: `INV-IN-${Date.now()}-1`,
        customer: "Tata Consultancy Services",
        assignedTo: cleanUsername,
        amount: 380000,
        status: "Outstanding",
        priority: "High",
        daysOverdue: 12,
        issued: new Date().toISOString().slice(0, 10),
        due: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      },
      {
        id: `INV-IN-${Date.now()}-2`,
        customer: "Reliance Digital",
        assignedTo: cleanUsername,
        amount: 240000,
        status: "Overdue",
        priority: "Medium",
        daysOverdue: 28,
        issued: new Date(Date.now() - 35 * 86400000).toISOString().slice(0, 10),
        due: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
      }
    );

    res.writeHead(201, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ token: newUser.token, user: newUser }));
  }

  // Authentication: POST /api/auth/login
  if (req.method === "POST" && (pathname === "/api/auth/login" || pathname === "/auth/login")) {
    const body = await parseJsonBody(req);
    const cleanUsername = body?.username?.trim().toLowerCase();
    const user = registeredUsers[cleanUsername];

    const isDemoPass = DEMO_USERS[cleanUsername] && body?.password === `${cleanUsername}123`;
    const isCustomPass = user && user.password && body?.password === user.password;

    if (user && (isDemoPass || isCustomPass)) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ token: user.token, user }));
    }
    res.writeHead(401, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Invalid username or password. Check credentials or register." }));
  }

  const currentUser = getUserFromToken(req);

  const userInvoices = currentUser.role === "Admin"
    ? invoicesStore
    : invoicesStore.filter((i) => i.assignedTo === currentUser.username);

  // Get Invoices: GET /api/invoices
  if (req.method === "GET" && (pathname === "/api/invoices" || pathname === "/invoices")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(userInvoices));
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
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(Object.values(map)));
  }

  // NFC Lookup: GET /api/nfc/lookup
  if (req.method === "GET" && (pathname === "/api/nfc/lookup" || pathname === "/nfc/lookup")) {
    const tagId = url.searchParams.get("tagId") || url.searchParams.get("id");
    const inv = userInvoices.find((i) => i.status !== "Paid");
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ tagId, customer: inv?.customer || "Tata Consultancy Services", invoice: inv || null }));
  }

  // Get Visits: GET /api/visits
  if (req.method === "GET" && (pathname === "/api/visits" || pathname === "/visits")) {
    const userVisits = currentUser.role === "Admin"
      ? visitsStore
      : visitsStore.filter((v) => v.agent === currentUser.username || v.agent === currentUser.name);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(userVisits));
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

    res.writeHead(201, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(newVisit));
  }

  // Dashboard Summary: GET /api/dashboard/summary
  if (req.method === "GET" && (pathname === "/api/dashboard/summary" || pathname === "/dashboard/summary")) {
    const unpaid = userInvoices.filter((i) => i.status !== "Paid");
    const totalOutstanding = unpaid.reduce((s, i) => s + i.amount, 0);
    const overdue = unpaid.filter((i) => i.daysOverdue > 0);
    const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0);
    const highCount = unpaid.filter((i) => i.priority === "High").length;
    const paidCount = userInvoices.filter((i) => i.status === "Paid").length;

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      totalOutstanding,
      totalOverdue,
      highPriorityCount: highCount,
      collectionRate: userInvoices.length ? Math.round((paidCount / userInvoices.length) * 100) : 0,
      openInvoiceCount: unpaid.length,
    }));
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  return res.end(JSON.stringify({ error: "Endpoint not found" }));
});

server.listen(PORT, () => {
  console.log(`CollectIQ Server running on port ${PORT}`);
});
