import { invoices as mockInvoices, mockVisits, CUSTOMERS_LIST, findCustomer } from "./mockData.js";

const API_BASE = import.meta.env.VITE_API_URL || "";

const DEMO_USERS = {
  admin: { id: "u1", username: "admin", name: "Sarah Connor (Admin)", role: "Admin", token: "tok_admin_12345" },
  agent1: { id: "u2", username: "agent1", name: "Alex Rivera (Agent 1)", role: "Field Agent", token: "tok_agent1_12345" },
  agent2: { id: "u3", username: "agent2", name: "Marcus Vance (Agent 2)", role: "Field Agent", token: "tok_agent2_12345" },
};

function getRegisteredUsers() {
  const saved = localStorage.getItem("collectiq_registered_users");
  if (saved) {
    try { return { ...DEMO_USERS, ...JSON.parse(saved) }; } catch {}
  }
  return DEMO_USERS;
}

function getLocalInvoices() {
  const saved = localStorage.getItem("collectiq_invoices");
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  localStorage.setItem("collectiq_invoices", JSON.stringify(mockInvoices));
  return mockInvoices;
}

function getLocalVisits() {
  const saved = localStorage.getItem("collectiq_visits");
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  localStorage.setItem("collectiq_visits", JSON.stringify(mockVisits));
  return mockVisits;
}

function getUserByToken(token) {
  const users = getRegisteredUsers();
  return Object.values(users).find((u) => u.token === token) || DEMO_USERS.admin;
}

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const url = API_BASE ? `${API_BASE}${path}` : path;
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) {
      return await res.json();
    }
    if (res.status === 404) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || "Customer not found");
    }
  } catch (err) {
    if (err.message && (err.message.includes("Customer not found") || err.message.includes("not linked"))) {
      throw err;
    }
    // Fallback to client mock engine
  }

  const users = getRegisteredUsers();
  const currentUser = getUserByToken(token);
  const allInvoices = getLocalInvoices();
  const userInvoices = currentUser.role === "Admin"
    ? allInvoices
    : allInvoices.filter((i) => i.assignedTo === currentUser.username);

  // Client-Side Registration Fallback
  if (path.includes("/auth/register") && method === "POST") {
    const { username, password, name, role } = body || {};
    if (!username || !password) {
      throw new Error("Username and password are required.");
    }
    const cleanUsername = username.trim().toLowerCase();
    if (users[cleanUsername]) {
      throw new Error("Username is already taken. Please choose another.");
    }

    const newUser = {
      id: `u_${Date.now()}`,
      username: cleanUsername,
      name: name?.trim() || cleanUsername,
      role: role || "Field Agent",
      token: `tok_${cleanUsername}_${Date.now()}`,
      password: password,
    };

    const updatedUsers = { ...users, [cleanUsername]: newUser };
    localStorage.setItem("collectiq_registered_users", JSON.stringify(updatedUsers));

    // Seed initial sample invoices for new agent
    allInvoices.push(
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
    localStorage.setItem("collectiq_invoices", JSON.stringify(allInvoices));

    return { token: newUser.token, user: newUser };
  }

  // Client-Side Login Fallback
  if (path.includes("/auth/login") && method === "POST") {
    const cleanUsername = body?.username?.trim().toLowerCase();
    const user = users[cleanUsername];

    const isDemoPass = DEMO_USERS[cleanUsername] && body?.password === `${cleanUsername}123`;
    const isCustomPass = user && user.password && body?.password === user.password;

    if (user && (isDemoPass || isCustomPass)) {
      return { token: user.token, user };
    }
    throw new Error("Invalid username or password. Check credentials or create an account.");
  }

  if (path.includes("/invoices")) {
    return userInvoices;
  }

  // Single Customer Visit Fallback: POST /api/customers/:id/visit
  const customerVisitMatch = path.match(/customers\/([^\/\?]+)\/visit/i);
  if (customerVisitMatch && method === "POST") {
    const customerId = customerVisitMatch[1];
    const customer = findCustomer(customerId);
    const custName = customer ? customer.name : customerId;
    const custInvoices = allInvoices.filter((i) => i.customer.toLowerCase() === custName.toLowerCase() || (customer && i.customerId === customer.id));

    if (!customer && custInvoices.length === 0) {
      throw new Error("Customer Not Found: The NFC card is not linked to a valid CollectIQ customer.");
    }

    const visits = getLocalVisits();
    const visitAmount = Number(body?.amount) || 0;
    const nowIso = new Date().toISOString();

    const newVisit = {
      id: `v-${Date.now()}`,
      customerId: customer ? customer.id : customerId.toUpperCase(),
      customer: customer ? customer.name : custName,
      outcome: body?.outcome || "NFC Tap Check-in",
      date: nowIso.split("T")[0],
      visit_time: nowIso,
      agent: currentUser.name || currentUser.username || body?.agent || "Field Agent",
      amount: visitAmount,
      notes: body?.notes || "Customer identified & visit verified via NFC card tap.",
      type: "NFC_TAP",
    };

    visits.unshift(newVisit);
    localStorage.setItem("collectiq_visits", JSON.stringify(visits));

    if (body?.invoiceId) {
      const invs = allInvoices.map((inv) => {
        if (inv.id !== body.invoiceId) return inv;
        if (body?.outcome === "Collected Cash" || visitAmount > 0) {
          if (visitAmount >= inv.amount) {
            return { ...inv, status: "Paid", priority: "Low", daysOverdue: 0 };
          } else {
            return { ...inv, status: "Partially Paid", amount: Math.max(0, inv.amount - visitAmount) };
          }
        }
        if (body?.outcome === "Promised Payment" && inv.status === "Overdue") {
          return { ...inv, status: "Partially Paid" };
        }
        return inv;
      });
      localStorage.setItem("collectiq_invoices", JSON.stringify(invs));
    }

    return {
      success: true,
      message: "Visit recorded successfully",
      customer_id: newVisit.customerId,
      customer: newVisit.customer,
      visit_time: newVisit.visit_time,
      visit: newVisit,
    };
  }

  // Single Customer Profile Fallback: GET /api/customers/:id
  const singleCustomerMatch = path.match(/customers\/([^\/\?]+)$/i);
  if (singleCustomerMatch && method === "GET") {
    const customerId = singleCustomerMatch[1];
    const customer = findCustomer(customerId);
    const custName = customer ? customer.name : customerId;
    const custInvoices = allInvoices.filter((i) => i.customer.toLowerCase() === custName.toLowerCase() || (customer && i.customerId === customer.id));

    if (!customer && custInvoices.length === 0) {
      throw new Error("Customer Not Found: The NFC card is not linked to a valid CollectIQ customer.");
    }

    const unpaid = custInvoices.filter((i) => i.status !== "Paid");
    const outstanding = unpaid.reduce((s, i) => s + i.amount, 0);
    const overdue = unpaid.filter((i) => i.daysOverdue > 0).reduce((s, i) => s + i.amount, 0);
    const high = unpaid.filter((i) => i.priority === "High").length;

    const visits = getLocalVisits();
    const customerVisits = visits.filter((v) =>
      (customer && v.customerId === customer.id) ||
      v.customer.toLowerCase() === custName.toLowerCase()
    );
    const lastVisit = customerVisits[0] || null;

    return {
      id: customer ? customer.id : customerId.toUpperCase(),
      name: customer ? customer.name : custName,
      outstanding,
      overdue,
      high,
      address: customer?.address || "Plot 42, Industrial Area, Sector 18",
      phone: customer?.phone || "+91 98765 43210",
      agent: customer?.agent || custInvoices[0]?.assignedTo || "agent1",
      invoices: custInvoices,
      lastVisit: lastVisit ? (lastVisit.visit_time || lastVisit.date) : null,
      lastVisitRecord: lastVisit,
    };
  }

  // Customers List
  if (path.includes("/customers")) {
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

    const visits = getLocalVisits();
    Object.values(map).forEach((c) => {
      const v = visits.find((item) => item.customerId === c.id || item.customer.toLowerCase() === c.name.toLowerCase());
      if (v) c.lastVisit = v.visit_time || v.date;
    });

    return Object.values(map);
  }

  if (path.includes("/nfc/lookup")) {
    const inv = userInvoices.find((i) => i.status !== "Paid");
    return { tagId: "nfc_demo_1", customer: inv?.customer || "Tata Consultancy Services", invoice: inv || null };
  }

  if (path.includes("/visits") && method === "GET") {
    const allVisits = getLocalVisits();
    return currentUser.role === "Admin"
      ? allVisits
      : allVisits.filter((v) => v.agent === currentUser.username || v.agent === currentUser.name);
  }

  if (path.includes("/visits") && method === "POST") {
    const visits = getLocalVisits();
    const visitAmount = Number(body?.amount) || 0;
    const nowIso = new Date().toISOString();
    const matchedCustomer = findCustomer(body?.customerId || body?.customer);

    const newVisit = {
      id: `v-${Date.now()}`,
      customerId: matchedCustomer ? matchedCustomer.id : (body?.customerId || "CUST001"),
      customer: body?.customer || (matchedCustomer ? matchedCustomer.name : "Unknown"),
      outcome: body?.outcome || "Contacted Customer",
      date: nowIso.split("T")[0],
      visit_time: nowIso,
      agent: currentUser.name || currentUser.username || body?.agent || "Field Agent",
      amount: visitAmount,
      notes: body?.notes || "",
      type: body?.type || "FIELD_VISIT",
    };
    visits.unshift(newVisit);
    localStorage.setItem("collectiq_visits", JSON.stringify(visits));

    if (body?.invoiceId) {
      const invs = allInvoices.map((inv) => {
        if (inv.id !== body.invoiceId) return inv;
        if (body?.outcome === "Collected Cash" || visitAmount > 0) {
          if (visitAmount >= inv.amount) {
            return { ...inv, status: "Paid", priority: "Low", daysOverdue: 0 };
          } else {
            return { ...inv, status: "Partially Paid", amount: Math.max(0, inv.amount - visitAmount) };
          }
        }
        if (body?.outcome === "Promised Payment" && inv.status === "Overdue") {
          return { ...inv, status: "Partially Paid" };
        }
        return inv;
      });
      localStorage.setItem("collectiq_invoices", JSON.stringify(invs));
    }

    return newVisit;
  }

  throw new Error("API request failed");
}

export function login(username, password) {
  return request("/api/auth/login", { method: "POST", body: { username, password } });
}

export function register(username, password, name, role) {
  return request("/api/auth/register", { method: "POST", body: { username, password, name, role } });
}

export function getInvoices(token) {
  return request("/api/invoices", { token });
}

export function getCustomers(token) {
  return request("/api/customers", { token });
}

export function getCustomerById(token, customerId) {
  return request(`/api/customers/${encodeURIComponent(customerId)}`, { token });
}

export function recordCustomerVisit(token, customerId, visitData = {}) {
  return request(`/api/customers/${encodeURIComponent(customerId)}/visit`, {
    method: "POST",
    token,
    body: visitData,
  });
}

export function getVisits(token) {
  return request("/api/visits", { token });
}

export function postVisit(token, visit) {
  return request("/api/visits", { method: "POST", token, body: visit });
}

export function getDashboardSummary(token) {
  return request("/api/dashboard/summary", { token });
}

export function lookupNfcTag(tagId) {
  return request(`/api/nfc/lookup?tagId=${encodeURIComponent(tagId)}`);
}

