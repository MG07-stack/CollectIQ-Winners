import { invoices as mockInvoices, mockVisits } from "./mockData.js";

const API_BASE = import.meta.env.VITE_API_URL || "";

// Mock Local Storage fallback database
const MOCK_USERS = {
  admin: { id: "u1", username: "admin", name: "Sarah Connor (Admin)", role: "Admin", token: "tok_admin_12345" },
  agent1: { id: "u2", username: "agent1", name: "Alex Rivera (Agent 1)", role: "Field Agent", token: "tok_agent1_12345" },
  agent2: { id: "u3", username: "agent2", name: "Marcus Vance (Agent 2)", role: "Field Agent", token: "tok_agent2_12345" },
};

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
  return Object.values(MOCK_USERS).find((u) => u.token === token) || MOCK_USERS.admin;
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
  } catch {
    // Graceful fallback to client mock engine
  }

  const currentUser = getUserByToken(token);
  const allInvoices = getLocalInvoices();
  const userInvoices = currentUser.role === "Admin"
    ? allInvoices
    : allInvoices.filter((i) => i.assignedTo === currentUser.username);

  // Client-Side Fallback Engine
  if (path.includes("/auth/login") && method === "POST") {
    const user = MOCK_USERS[body?.username?.toLowerCase()];
    if (user && body?.password === `${user.username}123`) {
      return { token: user.token, user };
    }
    throw new Error("Invalid username or password. Try demo credentials: admin / admin123, agent1 / agent123, agent2 / agent123");
  }

  if (path.includes("/invoices")) {
    return userInvoices;
  }

  if (path.includes("/customers")) {
    const map = {};
    userInvoices.forEach((inv) => {
      if (!map[inv.customer]) map[inv.customer] = { name: inv.customer, invoices: [], outstanding: 0, high: 0 };
      map[inv.customer].invoices.push(inv);
      if (inv.status !== "Paid") map[inv.customer].outstanding += inv.amount;
      if (inv.priority === "High" && inv.status !== "Paid") map[inv.customer].high += 1;
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
    const newVisit = {
      id: `v-${Date.now()}`,
      customer: body?.customer || "Unknown",
      outcome: body?.outcome || "Contacted",
      date: new Date().toISOString().split("T")[0],
      agent: currentUser.name || currentUser.username,
      amount: visitAmount,
      notes: body?.notes || "",
    };
    visits.unshift(newVisit);
    localStorage.setItem("collectiq_visits", JSON.stringify(visits));

    if (body?.invoiceId) {
      const invs = allInvoices.map((inv) => {
        if (inv.id !== body.invoiceId) return inv;
        if (body?.outcome === "Collected Cash") {
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

export function getInvoices(token) {
  return request("/api/invoices", { token });
}

export function getCustomers(token) {
  return request("/api/customers", { token });
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
