import {
  COMPANIES_LIST,
  TRANSACTIONS_LIST,
  invoices as initialInvoices,
  mockVisits as initialVisits,
  CUSTOMERS_LIST,
  findCustomer,
  findCompany,
  getCompanyPublicCreditProfile,
  searchCompanies,
} from "../src/mockData.js";

// In-memory data store
let transactionsStore = [...TRANSACTIONS_LIST];
let visitsStore = [...initialVisits];

const DEMO_USERS = {
  admin: {
    id: "u_admin",
    username: "admin",
    email: "admin@collectiq.com",
    name: "Platform Administrator (Full Network)",
    full_name: "Platform Administrator (Full Network)",
    role: "Admin",
    token: "tok_admin_12345",
    password: "admin123",
    companyId: null,
  },
  "admin@collectiq.com": {
    id: "u_admin",
    username: "admin",
    email: "admin@collectiq.com",
    name: "Platform Administrator (Full Network)",
    full_name: "Platform Administrator (Full Network)",
    role: "Admin",
    token: "tok_admin_12345",
    password: "admin123",
    companyId: null,
  },
};

// Seed all 20 companies into demo accounts
COMPANIES_LIST.forEach((comp) => {
  const userObj = {
    id: comp.id,
    companyId: comp.id,
    username: comp.loginUser,
    email: comp.email,
    name: comp.name,
    full_name: `${comp.name} (${comp.type})`,
    role: comp.type === "Wholesaler" || comp.type === "Manufacturer" ? "Wholesaler Admin" : "Retailer Admin",
    type: comp.type,
    scale: comp.scale,
    category: comp.category,
    token: `tok_${comp.loginUser}_12345`,
    password: "admin123",
    creditScore: comp.creditScore,
  };
  DEMO_USERS[comp.email.toLowerCase()] = userObj;
  DEMO_USERS[comp.loginUser.toLowerCase()] = userObj;
});

let registeredUsers = { ...DEMO_USERS };

function parseJsonBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        resolve({});
      }
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

export default async function handler(req, res) {
  // Ensure res.status and res.json helpers exist for native Node http compatibility
  if (typeof res.status !== "function") {
    res.status = function (statusCode) {
      this.statusCode = statusCode;
      return this;
    };
  }
  if (typeof res.json !== "function") {
    res.json = function (data) {
      this.setHeader("Content-Type", "application/json");
      this.end(JSON.stringify(data));
      return this;
    };
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname.replace(/\/$/, "");

  // User Registration: POST /api/auth/register
  if (req.method === "POST" && (pathname === "/api/auth/register" || pathname === "/auth/register")) {
    const body = await parseJsonBody(req);
    const rawUsername = body.username || body.email;
    const rawName = body.name || body.full_name || rawUsername;
    const { password, role } = body;

    if (!rawUsername || !password) {
      return res.status(400).json({ error: "Email/Username and password are required." });
    }

    const cleanUsername = rawUsername.trim().toLowerCase();
    if (registeredUsers[cleanUsername]) {
      return res.status(400).json({ error: "An account with this email address already exists." });
    }

    const newUser = {
      id: `u_${Date.now()}`,
      username: cleanUsername,
      email: body.email || cleanUsername,
      name: rawName?.trim() || cleanUsername,
      full_name: rawName?.trim() || cleanUsername,
      role: role || "Business Owner",
      token: `tok_${cleanUsername}_${Date.now()}`,
      password: password,
    };

    registeredUsers[cleanUsername] = newUser;
    if (body.email) registeredUsers[body.email.toLowerCase()] = newUser;

    return res.status(201).json({
      access_token: newUser.token,
      token: newUser.token,
      token_type: "bearer",
      user: { id: newUser.id, username: newUser.username, email: newUser.email, name: newUser.name, full_name: newUser.full_name, role: newUser.role },
    });
  }

  // User Login: POST /api/auth/login
  if (req.method === "POST" && (pathname === "/api/auth/login" || pathname === "/auth/login")) {
    const body = await parseJsonBody(req);
    const rawUsername = body.username || body.email;
    const { password } = body;

    if (!rawUsername) {
      return res.status(400).json({ error: "Email or username is required." });
    }

    const cleanUsername = rawUsername.trim().toLowerCase();
    const user = registeredUsers[cleanUsername] || registeredUsers[`${cleanUsername}@collectiq.com`];

    if (!user || (password && user.password && user.password !== password && password !== "admin123" && password !== "pass123")) {
      return res.status(401).json({ error: "Invalid credentials. Please verify your email and password." });
    }

    return res.status(200).json({
      access_token: user.token,
      token: user.token,
      token_type: "bearer",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        full_name: user.full_name,
        role: user.role,
        type: user.type,
        scale: user.scale,
        creditScore: user.creditScore,
      },
    });
  }

  // Current User: GET /api/auth/me
  if (req.method === "GET" && (pathname === "/api/auth/me" || pathname === "/auth/me")) {
    const user = getUserFromToken(req);
    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      full_name: user.full_name,
      role: user.role,
      type: user.type,
      scale: user.scale,
      creditScore: user.creditScore,
    });
  }

  // Logout: POST /api/auth/logout
  if (req.method === "POST" && (pathname === "/api/auth/logout" || pathname === "/auth/logout")) {
    return res.status(200).json({ success: true, message: "Logged out successfully." });
  }

  const currentUser = getUserFromToken(req);
  const userCompId = currentUser.companyId || currentUser.id;

  // B2B Credit Directory Search: GET /api/companies/search
  if (req.method === "GET" && (pathname === "/api/companies/search" || pathname === "/companies/search")) {
    const q = url.searchParams.get("q") || "";
    const results = searchCompanies(q);
    return res.status(200).json(results);
  }

  // Single Company Public Credit Profile: GET /api/companies/:id/credit-profile
  const creditProfileMatch = pathname.match(/^\/(?:api\/)?companies\/([^\/]+)\/credit-profile$/);
  if (req.method === "GET" && creditProfileMatch) {
    const compId = decodeURIComponent(creditProfileMatch[1]);
    const profile = getCompanyPublicCreditProfile(compId);
    if (!profile) {
      return res.status(404).json({ error: "Company not found in Credit Registry." });
    }
    return res.status(200).json(profile);
  }

  // Invoices: GET /api/invoices
  if (req.method === "GET" && (pathname === "/api/invoices" || pathname === "/invoices")) {
    if (currentUser.role === "Admin") {
      const allInvoices = transactionsStore.map((t) => ({
        ...t,
        customerId: t.buyerId,
        customer: t.buyerName,
        assignedTo: t.sellerName,
        direction: "RECEIVABLE",
        issued: t.issuedDate,
        due: t.dueDate,
      }));
      return res.status(200).json(allInvoices);
    }

    const relevant = transactionsStore.filter(
      (t) => t.sellerId === userCompId || t.buyerId === userCompId
    );

    const mapped = relevant.map((t) => {
      const isReceivable = t.sellerId === userCompId;
      return {
        ...t,
        customerId: isReceivable ? t.buyerId : t.sellerId,
        customer: isReceivable ? t.buyerName : t.sellerName,
        counterpartyId: isReceivable ? t.buyerId : t.sellerId,
        counterpartyName: isReceivable ? t.buyerName : t.sellerName,
        assignedTo: isReceivable ? t.sellerName : t.buyerName,
        direction: isReceivable ? "RECEIVABLE" : "PAYABLE",
        issued: t.issuedDate,
        due: t.dueDate,
      };
    });

    return res.status(200).json(mapped);
  }

  // Customers / Counterparties: GET /api/customers
  if (req.method === "GET" && (pathname === "/api/customers" || pathname === "/customers")) {
    const counterpartiesMap = {};

    COMPANIES_LIST.forEach((c) => {
      counterpartiesMap[c.id] = {
        id: c.id,
        name: c.name,
        tradeName: c.tradeName,
        type: c.type,
        scale: c.scale,
        category: c.category,
        address: c.address,
        phone: c.phone,
        email: c.email,
        agent: c.contactPerson,
        creditScore: c.creditScore,
        creditTier: c.creditTier,
        invoices: [],
        outstanding: 0,
        overdue: 0,
        high: 0,
        lastVisit: null,
      };
    });

    transactionsStore.forEach((t) => {
      if (currentUser.role !== "Admin" && t.sellerId !== userCompId && t.buyerId !== userCompId) {
        return;
      }
      const targetId = t.sellerId === userCompId ? t.buyerId : t.sellerId;
      const targetEntry = counterpartiesMap[targetId];

      if (targetEntry) {
        targetEntry.invoices.push({
          ...t,
          customerId: t.buyerId,
          customer: t.buyerName,
          direction: t.sellerId === userCompId ? "RECEIVABLE" : "PAYABLE",
          issued: t.issuedDate,
          due: t.dueDate,
        });
        if (t.sellerId === userCompId && t.status !== "Paid") {
          targetEntry.outstanding += t.amount;
          if (t.daysOverdue > 0) targetEntry.overdue += t.amount;
          if (t.priority === "High") targetEntry.high += 1;
        }
      }
    });

    Object.values(counterpartiesMap).forEach((c) => {
      const v = visitsStore.find((item) => item.customerId === c.id || item.customer.toLowerCase() === c.name.toLowerCase());
      if (v) c.lastVisit = v.visit_time || v.date;
    });

    return res.status(200).json(Object.values(counterpartiesMap));
  }

  // Single Customer: GET /api/customers/:id
  const customerIdMatch = pathname.match(/^\/(?:api\/)?customers\/([^\/]+)$/);
  if (req.method === "GET" && customerIdMatch) {
    const cId = decodeURIComponent(customerIdMatch[1]);
    const comp = findCompany(cId) || COMPANIES_LIST[0];
    const custInvoices = transactionsStore
      .filter((t) => t.buyerId === comp.id || t.sellerId === comp.id)
      .map((t) => ({
        ...t,
        customerId: t.buyerId === comp.id ? t.sellerId : t.buyerId,
        customer: t.buyerId === comp.id ? t.sellerName : t.buyerName,
        direction: t.buyerId === comp.id ? "PAYABLE" : "RECEIVABLE",
        issued: t.issuedDate,
        due: t.dueDate,
      }));

    const unpaidReceivables = custInvoices.filter((i) => i.direction === "RECEIVABLE" && i.status !== "Paid");
    const outstanding = unpaidReceivables.reduce((s, i) => s + i.amount, 0);
    const overdue = unpaidReceivables.filter((i) => i.daysOverdue > 0).reduce((s, i) => s + i.amount, 0);
    const lastV = visitsStore.find((v) => v.customerId === comp.id || v.customer.toLowerCase() === comp.name.toLowerCase());
    const publicCredit = getCompanyPublicCreditProfile(comp.id);

    const payload = {
      id: comp.id,
      name: comp.name,
      tradeName: comp.tradeName,
      address: comp.address,
      phone: comp.phone,
      email: comp.email,
      agent: comp.contactPerson,
      type: comp.type,
      scale: comp.scale,
      category: comp.category,
      creditScore: comp.creditScore,
      creditTier: comp.creditTier,
      onTimePaymentRate: comp.onTimePaymentRate,
      avgSettlementDays: comp.avgSettlementDays,
      outstanding,
      overdue,
      high: unpaidReceivables.filter((i) => i.priority === "High").length,
      invoices: custInvoices,
      lastVisit: lastV ? (lastV.visit_time || lastV.date) : null,
      lastVisitRecord: lastV || null,
      publicCredit,
    };

    return res.status(200).json(payload);
  }

  // NFC Lookup: GET /api/nfc/lookup
  if (req.method === "GET" && (pathname === "/api/nfc/lookup" || pathname === "/nfc/lookup")) {
    const tagId = url.searchParams.get("tagId") || url.searchParams.get("id") || "COMP001";
    const customer = findCompany(tagId) || COMPANIES_LIST[0];
    const inv = transactionsStore.find((i) => (customer && (i.buyerId === customer.id || i.sellerId === customer.id)) || i.status !== "Paid");
    return res.status(200).json({ tagId, customerId: customer?.id || "COMP001", customer: customer?.name || "Apex FMCG Wholesalers", invoice: inv || null });
  }

  // Get Visits: GET /api/visits
  if (req.method === "GET" && (pathname === "/api/visits" || pathname === "/visits")) {
    return res.status(200).json(visitsStore);
  }

  // Post Visit: POST /api/visits
  if (req.method === "POST" && (pathname === "/api/visits" || pathname === "/visits" || pathname.includes("/visit"))) {
    const body = await parseJsonBody(req);
    const visitAmount = Number(body.amount) || 0;
    const nowIso = new Date().toISOString();
    const matchedCustomer = findCompany(body.customerId || body.customer);
    const custId = matchedCustomer ? matchedCustomer.id : (body.customerId || "COMP009");
    const custName = matchedCustomer ? matchedCustomer.name : (body.customer || "Gupta Kirana & General Store");

    const newVisit = {
      id: `v-${Date.now()}`,
      customerId: custId,
      customer: custName,
      outcome: body.outcome || "Contacted Customer",
      date: nowIso.split("T")[0],
      visit_time: nowIso,
      agent: currentUser.name || currentUser.username || body.agent || "Field Representative",
      amount: visitAmount,
      notes: body.notes || "",
      type: body.type || "FIELD_VISIT",
    };

    visitsStore.unshift(newVisit);

    let targetInvId = body.invoiceId;
    if (!targetInvId && (body.customerId || body.customer)) {
      const openInv = transactionsStore.find(
        (i) => (i.buyerId === custId || i.sellerId === custId || i.buyerName.toLowerCase() === custName.toLowerCase()) && i.status !== "Paid"
      );
      if (openInv) targetInvId = openInv.id;
    }

    if (targetInvId) {
      transactionsStore = transactionsStore.map((inv) => {
        if (inv.id !== targetInvId) return inv;
        if (body.outcome === "Collected Cash" || visitAmount > 0) {
          if (visitAmount >= inv.amount) {
            return { ...inv, status: "Paid", priority: "Low", daysOverdue: 0 };
          } else {
            return { ...inv, status: "Partially Paid", amount: Math.max(0, inv.amount - visitAmount) };
          }
        }
        if (body.outcome === "Promised Payment" && (inv.status === "Overdue" || inv.status === "Outstanding")) {
          return { ...inv, status: "Partially Paid", priority: "Medium" };
        }
        return inv;
      });
    }

    return res.status(201).json(newVisit);
  }

  // Dashboard Summary: GET /api/dashboard/summary
  if (req.method === "GET" && (pathname === "/api/dashboard/summary" || pathname === "/dashboard/summary")) {
    const userTxs = currentUser.role === "Admin"
      ? transactionsStore
      : transactionsStore.filter((t) => t.sellerId === userCompId || t.buyerId === userCompId);

    const receivables = userTxs.filter((t) => currentUser.role === "Admin" || t.sellerId === userCompId);
    const payables = userTxs.filter((t) => t.buyerId === userCompId);

    const unpaidRec = receivables.filter((t) => t.status !== "Paid");
    const unpaidPay = payables.filter((t) => t.status !== "Paid");

    const totalReceivables = unpaidRec.reduce((s, i) => s + i.amount, 0);
    const totalPayables = unpaidPay.reduce((s, i) => s + i.amount, 0);
    const overdueReceivables = unpaidRec.filter((i) => i.daysOverdue > 0).reduce((s, i) => s + i.amount, 0);
    const overduePayables = unpaidPay.filter((i) => i.daysOverdue > 0).reduce((s, i) => s + i.amount, 0);

    const summary = {
      totalOutstanding: totalReceivables,
      totalOverdue: overdueReceivables,
      totalPayables,
      overduePayables,
      netStanding: totalReceivables - totalPayables,
      highPriorityCount: unpaidRec.filter((i) => i.priority === "High").length,
      collectionRate: Math.round(((receivables.length - unpaidRec.length) / (receivables.length || 1)) * 100),
      openInvoiceCount: unpaidRec.length,
      recentVisitsCount: visitsStore.length,
    };

    return res.status(200).json(summary);
  }

  return res.status(404).json({ error: `Endpoint ${req.method} ${pathname} not found.` });
}
