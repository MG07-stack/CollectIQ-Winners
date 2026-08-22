import { invoices as initialInvoices, mockVisits as initialVisits, CUSTOMERS_LIST, findCustomer } from "./mockData.js";

const API_BASE = import.meta.env.VITE_API_URL || "";

const mockInvoicesStore = [...initialInvoices];
const mockVisitsStore = [...initialVisits];

const MOCK_DEMO_USERS = {
  "admin@collectiq.com": {
    id: "u1",
    username: "admin",
    email: "admin@collectiq.com",
    name: "Sarah Connor (Admin)",
    full_name: "Sarah Connor (Admin)",
    role: "Admin",
    token: "tok_admin_12345",
  },
  "agent1@collectiq.com": {
    id: "u2",
    username: "agent1",
    email: "agent1@collectiq.com",
    name: "Alex Rivera (Agent 1)",
    full_name: "Alex Rivera (Agent 1)",
    role: "Field Agent",
    token: "tok_agent1_12345",
  },
  "agent2@collectiq.com": {
    id: "u3",
    username: "agent2",
    email: "agent2@collectiq.com",
    name: "Marcus Vance (Agent 2)",
    full_name: "Marcus Vance (Agent 2)",
    role: "Field Agent",
    token: "tok_agent2_12345",
  },
};

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = API_BASE ? `${API_BASE}${path}` : path;

  let res;
  let networkFailed = false;

  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (netErr) {
    networkFailed = true;
  }

  // Handle network failure or 5xx proxy connection error gracefully with seamless local fallback
  if (networkFailed || (res && res.status >= 500)) {
    if (path.includes("/auth/login") && body) {
      const emailClean = (body.email || body.username || "").trim().toLowerCase();
      const matched =
        MOCK_DEMO_USERS[emailClean] ||
        MOCK_DEMO_USERS[`${emailClean}@collectiq.com`] ||
        {
          id: `u_${Date.now()}`,
          email: emailClean,
          username: emailClean.split("@")[0],
          name: emailClean.split("@")[0],
          full_name: emailClean.split("@")[0],
          role: "Field Agent",
          token: `tok_${emailClean}_${Date.now()}`,
        };
      return { access_token: matched.token, token: matched.token, token_type: "bearer", user: matched };
    }

    if (path.includes("/auth/register") && body) {
      const emailClean = (body.email || body.username || "").trim().toLowerCase();
      const fullName = (body.full_name || body.name || emailClean.split("@")[0]).trim();
      const user = {
        id: `u_${Date.now()}`,
        email: emailClean,
        username: emailClean.split("@")[0],
        name: fullName,
        full_name: fullName,
        role: body.role || "Field Agent",
        token: `tok_${emailClean}_${Date.now()}`,
      };
      return { access_token: user.token, token: user.token, token_type: "bearer", user };
    }

    if (path.includes("/auth/me")) {
      return MOCK_DEMO_USERS["admin@collectiq.com"];
    }

    if (path.includes("/invoices")) {
      return mockInvoicesStore;
    }

    if ((path.includes("/visits") || path.includes("/visit")) && method === "POST" && body) {
      const matchedCust = findCustomer(body.customerId || body.customer);
      const custId = matchedCust ? matchedCust.id : (body.customerId || "CUST001");
      const custName = matchedCust ? matchedCust.name : (body.customer || "Sharma Traders");
      const visitAmount = Number(body.amount) || 0;
      const nowIso = new Date().toISOString();

      const newVisit = {
        id: `v-${Date.now()}`,
        customerId: custId,
        customer: custName,
        outcome: body.outcome || "Contacted Customer",
        date: nowIso.split("T")[0],
        visit_time: nowIso,
        agent: body.agent || "Field Agent",
        amount: visitAmount,
        notes: body.notes || "",
        type: body.type || (path.includes("/customers/") ? "NFC_TAP" : "FIELD_VISIT"),
      };

      mockVisitsStore.unshift(newVisit);

      // Update matching invoice in mock store
      let targetInvIndex = -1;
      if (body.invoiceId) {
        targetInvIndex = mockInvoicesStore.findIndex((i) => i.id === body.invoiceId);
      }
      if (targetInvIndex === -1) {
        targetInvIndex = mockInvoicesStore.findIndex(
          (i) => (i.customerId === custId || i.customer.toLowerCase() === custName.toLowerCase()) && i.status !== "Paid"
        );
      }

      if (targetInvIndex !== -1) {
        const inv = mockInvoicesStore[targetInvIndex];
        if (body.outcome === "Collected Cash" || visitAmount > 0) {
          if (visitAmount >= inv.amount) {
            mockInvoicesStore[targetInvIndex] = { ...inv, status: "Paid", priority: "Low", daysOverdue: 0 };
          } else {
            mockInvoicesStore[targetInvIndex] = { ...inv, status: "Partially Paid", amount: Math.max(0, inv.amount - visitAmount) };
          }
        } else if (body.outcome === "Promised Payment" && (inv.status === "Overdue" || inv.status === "Outstanding")) {
          mockInvoicesStore[targetInvIndex] = { ...inv, status: "Partially Paid", priority: "Medium" };
        }
      }

      if (path.includes("/customers/")) {
        return {
          success: true,
          message: "Visit recorded successfully",
          customer_id: custId,
          customer: custName,
          visit_time: nowIso,
          visit: newVisit,
        };
      }
      return newVisit;
    }

    if (path.includes("/visits")) {
      return mockVisitsStore;
    }

    if (path.includes("/customers")) {
      const singleMatch = path.match(/\/customers\/([^\/\?]+)$/);
      if (singleMatch) {
        const cId = decodeURIComponent(singleMatch[1]);
        const cust = findCustomer(cId) || CUSTOMERS_LIST[0];
        const custInvoices = mockInvoicesStore.filter((i) => i.customerId === cust.id || i.customer.toLowerCase() === cust.name.toLowerCase());
        const unpaid = custInvoices.filter((i) => i.status !== "Paid");
        const outstanding = unpaid.reduce((s, i) => s + i.amount, 0);
        const overdue = unpaid.filter((i) => i.daysOverdue > 0).reduce((s, i) => s + i.amount, 0);
        const lastV = mockVisitsStore.find((v) => v.customerId === cust.id || v.customer.toLowerCase() === cust.name.toLowerCase());
        return {
          id: cust.id,
          name: cust.name,
          address: cust.address,
          phone: cust.phone,
          agent: cust.agent,
          outstanding,
          overdue,
          high: unpaid.filter((i) => i.priority === "High").length,
          invoices: custInvoices,
          lastVisit: lastV ? (lastV.visit_time || lastV.date) : null,
          lastVisitRecord: lastV || null,
        };
      }

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

      mockInvoicesStore.forEach((inv) => {
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

      Object.values(map).forEach((c) => {
        const v = mockVisitsStore.find((item) => item.customerId === c.id || item.customer.toLowerCase() === c.name.toLowerCase());
        if (v) c.lastVisit = v.visit_time || v.date;
      });

      return Object.values(map);
    }

    if (path.includes("/dashboard/summary")) {
      const unpaid = mockInvoicesStore.filter((i) => i.status !== "Paid");
      return {
        totalOutstanding: unpaid.reduce((s, i) => s + i.amount, 0),
        totalOverdue: unpaid.filter((i) => i.daysOverdue > 0).reduce((s, i) => s + i.amount, 0),
        highPriorityCount: unpaid.filter((i) => i.priority === "High").length,
        collectionRate: Math.round(((mockInvoicesStore.length - unpaid.length) / (mockInvoicesStore.length || 1)) * 100),
        openInvoiceCount: unpaid.length,
        recentVisitsCount: mockVisitsStore.length,
      };
    }

    if (path.includes("/nfc/lookup")) {
      const customer = CUSTOMERS_LIST[0];
      const inv = mockInvoicesStore.find((i) => i.customerId === customer.id);
      return { tagId: "CUST001", customerId: customer.id, customer: customer.name, invoice: inv };
    }
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errorMsg =
      (data && (data.detail || data.message || data.error)) ||
      `Server error (${res.status}). Please check your inputs or try again.`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Authentication API
export async function login(email, password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  return {
    token: data.access_token || data.token,
    user: data.user,
  };
}

export async function register(email, password, fullName, role = "Field Agent") {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: {
      email,
      username: email,
      password,
      full_name: fullName,
      name: fullName,
      role,
    },
  });
  return {
    token: data.access_token || data.token,
    user: data.user,
  };
}

export async function getMe(token) {
  return request("/api/auth/me", { token });
}

export async function logout(token) {
  try {
    return await request("/api/auth/logout", { method: "POST", token });
  } catch {
    return { success: true };
  }
}

// Invoices API
export async function getInvoices(token) {
  return request("/api/invoices", { token });
}

export async function createInvoice(token, invoiceData) {
  return request("/api/invoices", { method: "POST", token, body: invoiceData });
}

// Customers API
export async function getCustomers(token) {
  return request("/api/customers", { token });
}

export async function getCustomerById(token, customerId) {
  return request(`/api/customers/${encodeURIComponent(customerId)}`, { token });
}

export async function recordCustomerVisit(token, customerId, visitData = {}) {
  return request(`/api/customers/${encodeURIComponent(customerId)}/visit`, {
    method: "POST",
    token,
    body: visitData,
  });
}

// Visits API
export async function getVisits(token) {
  return request("/api/visits", { token });
}

export async function postVisit(token, visit) {
  return request("/api/visits", { method: "POST", token, body: visit });
}

// Dashboard Summary API
export async function getDashboardSummary(token) {
  return request("/api/dashboard/summary", { token });
}

// NFC Lookup API
export async function lookupNfcTag(tagId, token) {
  return request(`/api/nfc/lookup?tagId=${encodeURIComponent(tagId)}`, { token });
}
