import http from "node:http";
import { invoices as initialInvoices, mockVisits as initialVisits, CUSTOMERS_LIST, findCustomer } from "./src/mockData.js";

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
        customerId: "CUST002",
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
        customerId: "CUST003",
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

  // Visit Recording for specific customer: POST /api/customers/:customer_id/visit
  const customerVisitMatch = pathname.match(/^(?:\/api)?\/customers\/([^\/]+)\/visit$/i);
  if (req.method === "POST" && customerVisitMatch) {
    const customerId = customerVisitMatch[1];
    const customer = findCustomer(customerId);
    const custName = customer ? customer.name : customerId;
    const custInvoices = invoicesStore.filter((i) => i.customer.toLowerCase() === custName.toLowerCase() || (customer && i.customerId === customer.id));

    if (!customer && custInvoices.length === 0) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        error: "Customer Not Found",
        message: "The NFC card is not linked to a valid CollectIQ customer.",
        customer_id: customerId,
      }));
    }

    const body = await parseJsonBody(req);
    const visitAmount = Number(body.amount) || 0;
    const nowIso = new Date().toISOString();

    const newVisit = {
      id: `v-${Date.now()}`,
      customerId: customer ? customer.id : customerId.toUpperCase(),
      customer: customer ? customer.name : custName,
      outcome: body.outcome || "NFC Tap Check-in",
      date: nowIso.split("T")[0],
      visit_time: nowIso,
      agent: currentUser.name || currentUser.username || body.agent || "Field Agent",
      amount: visitAmount,
      notes: body.notes || "Customer identified & verified via NFC card tap.",
      type: "NFC_TAP",
    };

    visitsStore.unshift(newVisit);

    if (body.invoiceId) {
      invoicesStore = invoicesStore.map((inv) => {
        if (inv.id !== body.invoiceId) return inv;
        if (body.outcome === "Collected Cash" || visitAmount > 0) {
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
    return res.end(JSON.stringify({
      success: true,
      message: "Visit recorded successfully",
      customer_id: newVisit.customerId,
      customer: newVisit.customer,
      visit_time: newVisit.visit_time,
      visit: newVisit,
    }));
  }

  // Get Single Customer: GET /api/customers/:customer_id
  const singleCustomerMatch = pathname.match(/^(?:\/api)?\/customers\/([^\/]+)$/i);
  if (req.method === "GET" && singleCustomerMatch) {
    const customerId = singleCustomerMatch[1];
    const customer = findCustomer(customerId);
    const custName = customer ? customer.name : customerId;
    const custInvoices = invoicesStore.filter((i) => i.customer.toLowerCase() === custName.toLowerCase() || (customer && i.customerId === customer.id));

    if (!customer && custInvoices.length === 0) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        error: "Customer Not Found",
        message: "The NFC card is not linked to a valid CollectIQ customer.",
        customer_id: customerId,
      }));
    }

    const unpaid = custInvoices.filter((i) => i.status !== "Paid");
    const outstanding = unpaid.reduce((s, i) => s + i.amount, 0);
    const overdueInvoices = unpaid.filter((i) => i.daysOverdue > 0);
    const overdue = overdueInvoices.reduce((s, i) => s + i.amount, 0);
    const high = unpaid.filter((i) => i.priority === "High").length;

    const customerVisits = visitsStore.filter((v) =>
      (customer && v.customerId === customer.id) ||
      v.customer.toLowerCase() === custName.toLowerCase()
    );
    const lastVisit = customerVisits[0] || null;

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      id: customer ? customer.id : customerId.toUpperCase(),
      name: customer ? customer.name : custName,
      outstanding,
      overdue,
      high,
      address: customer?.address || "Registered Business Address",
      phone: customer?.phone || "+91 98765 43210",
      agent: customer?.agent || custInvoices[0]?.assignedTo || "agent1",
      invoices: custInvoices,
      lastVisit: lastVisit ? (lastVisit.visit_time || lastVisit.date) : null,
      lastVisitRecord: lastVisit,
    }));
  }

  // Get Customers List: GET /api/customers
  if (req.method === "GET" && (pathname === "/api/customers" || pathname === "/customers")) {
    const map = {};
    CUSTOMERS_LIST.forEach((c) => {
      map[c.name] = {
        id: c.id,
        name: c.name,
        address: c.address,
        phone: c.phone,
        agent: c.agent,
        invoices: [],
        outstanding: 0,
        overdue: 0,
        high: 0,
        lastVisit: null,
      };
    });

    userInvoices.forEach((inv) => {
      if (!map[inv.customer]) {
        const found = findCustomer(inv.customer);
        map[inv.customer] = {
          id: found ? found.id : `CUST-${inv.customer.slice(0, 4).toUpperCase()}`,
          name: inv.customer,
          address: found?.address || "Registered Address",
          phone: found?.phone || "+91 98000 00000",
          agent: inv.assignedTo,
          invoices: [],
          outstanding: 0,
          overdue: 0,
          high: 0,
          lastVisit: null,
        };
      }
      map[inv.customer].invoices.push(inv);
      if (inv.status !== "Paid") {
        map[inv.customer].outstanding += inv.amount;
        if (inv.daysOverdue > 0) map[inv.customer].overdue += inv.amount;
      }
      if (inv.priority === "High" && inv.status !== "Paid") map[inv.customer].high += 1;
    });

    // Populate last visit
    Object.values(map).forEach((c) => {
      const v = visitsStore.find((item) => item.customerId === c.id || item.customer.toLowerCase() === c.name.toLowerCase());
      if (v) c.lastVisit = v.visit_time || v.date;
    });

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(Object.values(map)));
  }

  // NFC Lookup: GET /api/nfc/lookup
  if (req.method === "GET" && (pathname === "/api/nfc/lookup" || pathname === "/nfc/lookup")) {
    const tagId = url.searchParams.get("tagId") || url.searchParams.get("id") || "CUST001";
    const customer = findCustomer(tagId) || CUSTOMERS_LIST[0];
    const inv = userInvoices.find((i) => (customer && i.customer === customer.name) || i.status !== "Paid");
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ tagId, customerId: customer?.id || "CUST001", customer: customer?.name || "Sharma Traders", invoice: inv || null }));
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
    const nowIso = new Date().toISOString();
    const matchedCustomer = findCustomer(body.customerId || body.customer);

    const newVisit = {
      id: `v-${Date.now()}`,
      customerId: matchedCustomer ? matchedCustomer.id : (body.customerId || "CUST001"),
      customer: body.customer || (matchedCustomer ? matchedCustomer.name : "Unknown"),
      outcome: body.outcome || "Contacted Customer",
      date: nowIso.split("T")[0],
      visit_time: nowIso,
      agent: currentUser.name || currentUser.username || body.agent || "Field Agent",
      amount: visitAmount,
      notes: body.notes || "",
      type: body.type || "FIELD_VISIT",
    };

    visitsStore.unshift(newVisit);

    if (body.invoiceId) {
      invoicesStore = invoicesStore.map((inv) => {
        if (inv.id !== body.invoiceId) return inv;
        if (body.outcome === "Collected Cash" || visitAmount > 0) {
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
      recentVisitsCount: visitsStore.length,
    }));
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  return res.end(JSON.stringify({ error: "Endpoint not found" }));
});

server.listen(PORT, () => {
  console.log(`CollectIQ Server running on port ${PORT}`);
});
