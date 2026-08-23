import {
  COMPANIES_LIST,
  TRANSACTIONS_LIST,
  invoices as initialInvoices,
  mockVisits as initialVisits,
  CUSTOMERS_LIST,
  findCustomer,
  findCompany,
  getTransactionsForCompany,
  getCompanyPublicCreditProfile,
  searchCompanies as searchCompaniesEngine,
} from "./mockData.js";

const API_BASE = import.meta.env.VITE_API_URL || "";

let mockTransactionsStore = [...TRANSACTIONS_LIST];
let mockVisitsStore = [...initialVisits];

// Generate Demo Accounts dictionary for all 20 Companies + Admin
const MOCK_DEMO_USERS = {
  "admin@collectiq.com": {
    id: "u_admin",
    username: "admin",
    email: "admin@collectiq.com",
    name: "Platform Administrator (Full Network)",
    full_name: "Platform Administrator (Full Network)",
    role: "Admin",
    token: "tok_admin_12345",
    companyId: null,
  },
};

// Add all 20 companies to demo users
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
    creditScore: comp.creditScore,
    creditTier: comp.creditTier,
  };
  MOCK_DEMO_USERS[comp.email.toLowerCase()] = userObj;
  MOCK_DEMO_USERS[comp.loginUser.toLowerCase()] = userObj;
});

// Helper to determine active logged-in user from token
function getLocalUserFromToken(token) {
  if (!token) return MOCK_DEMO_USERS["admin@collectiq.com"];
  const user = Object.values(MOCK_DEMO_USERS).find((u) => u.token === token);
  return user || MOCK_DEMO_USERS["admin@collectiq.com"];
}

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
    const currentUser = getLocalUserFromToken(token);

    // Authentication: Login
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
          role: "Retailer Admin",
          token: `tok_${emailClean}_${Date.now()}`,
        };
      return { access_token: matched.token, token: matched.token, token_type: "bearer", user: matched };
    }

    // Authentication: Register
    if (path.includes("/auth/register") && body) {
      const emailClean = (body.email || body.username || "").trim().toLowerCase();
      const fullName = (body.full_name || body.name || emailClean.split("@")[0]).trim();
      const user = {
        id: `u_${Date.now()}`,
        email: emailClean,
        username: emailClean.split("@")[0],
        name: fullName,
        full_name: fullName,
        role: body.role || "Business Owner",
        token: `tok_${emailClean}_${Date.now()}`,
      };
      MOCK_DEMO_USERS[emailClean] = user;
      return { access_token: user.token, token: user.token, token_type: "bearer", user };
    }

    if (path.includes("/auth/me")) {
      return currentUser;
    }

    // B2B Credit Directory Search (Privacy Preserving)
    if (path.includes("/companies/search")) {
      const urlParams = new URLSearchParams(path.split("?")[1] || "");
      const q = urlParams.get("q") || "";
      return searchCompaniesEngine(q);
    }

    // Single Company Public Credit Profile
    const companyCreditMatch = path.match(/\/companies\/([^\/\?]+)\/credit-profile/);
    if (companyCreditMatch) {
      const compId = decodeURIComponent(companyCreditMatch[1]);
      const profile = getCompanyPublicCreditProfile(compId);
      if (!profile) {
        throw new Error("Company not found in B2B Credit Registry.");
      }
      return profile;
    }

    // Invoices / Transactions (Receivables vs Payables)
    if (path.includes("/invoices")) {
      if (currentUser.role === "Admin") {
        return mockTransactionsStore.map((t) => ({
          ...t,
          customerId: t.buyerId,
          customer: t.buyerName,
          sellerId: t.sellerId,
          sellerName: t.sellerName,
          buyerId: t.buyerId,
          buyerName: t.buyerName,
          assignedTo: t.sellerName,
          direction: "RECEIVABLE",
          issued: t.issuedDate,
          due: t.dueDate,
        }));
      }

      // Filter transactions where user is Seller (Receivable) OR Buyer (Payable)
      const userCompId = currentUser.companyId || currentUser.id;
      const relevant = mockTransactionsStore.filter(
        (t) => t.sellerId === userCompId || t.buyerId === userCompId
      );

      return relevant.map((t) => {
        const isReceivable = t.sellerId === userCompId;
        return {
          ...t,
          customerId: isReceivable ? t.buyerId : t.sellerId,
          customer: isReceivable ? t.buyerName : t.sellerName,
          counterpartyId: isReceivable ? t.buyerId : t.sellerId,
          counterpartyName: isReceivable ? t.buyerName : t.sellerName,
          sellerId: t.sellerId,
          sellerName: t.sellerName,
          buyerId: t.buyerId,
          buyerName: t.buyerName,
          assignedTo: isReceivable ? t.sellerName : t.buyerName,
          direction: isReceivable ? "RECEIVABLE" : "PAYABLE",
          issued: t.issuedDate,
          due: t.dueDate,
        };
      });
    }

    // Post Visit / Record Cash & Cheque Payment
    if ((path.includes("/visits") || path.includes("/visit")) && method === "POST" && body) {
      const matchedCust = findCompany(body.customerId || body.customer);
      const custId = matchedCust ? matchedCust.id : (body.customerId || "COMP009");
      const custName = matchedCust ? matchedCust.name : (body.customer || "Gupta Kirana & General Store");
      const visitAmount = Number(body.amount) || 0;
      const nowIso = new Date().toISOString();

      const newVisit = {
        id: `v-${Date.now()}`,
        customerId: custId,
        customer: custName,
        outcome: body.outcome || "Contacted Customer",
        date: nowIso.split("T")[0],
        visit_time: nowIso,
        agent: currentUser.name || body.agent || "Field Representative",
        amount: visitAmount,
        notes: body.notes || "",
        type: body.type || (path.includes("/customers/") ? "NFC_TAP" : "FIELD_VISIT"),
      };

      mockVisitsStore.unshift(newVisit);

      // Update matching invoice in transactions store
      let targetInvIndex = -1;
      if (body.invoiceId) {
        targetInvIndex = mockTransactionsStore.findIndex((i) => i.id === body.invoiceId);
      }
      if (targetInvIndex === -1) {
        targetInvIndex = mockTransactionsStore.findIndex(
          (i) => (i.buyerId === custId || i.sellerId === custId || i.buyerName.toLowerCase() === custName.toLowerCase()) && i.status !== "Paid"
        );
      }

      if (targetInvIndex !== -1) {
        const inv = mockTransactionsStore[targetInvIndex];
        if (body.outcome === "Collected Cash" || visitAmount > 0) {
          if (visitAmount >= inv.amount) {
            mockTransactionsStore[targetInvIndex] = { ...inv, status: "Paid", priority: "Low", daysOverdue: 0 };
          } else {
            mockTransactionsStore[targetInvIndex] = { ...inv, status: "Partially Paid", amount: Math.max(0, inv.amount - visitAmount) };
          }
        } else if (body.outcome === "Promised Payment" && (inv.status === "Overdue" || inv.status === "Outstanding")) {
          mockTransactionsStore[targetInvIndex] = { ...inv, status: "Partially Paid", priority: "Medium" };
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

    // Customers / Counterparties List & Single Profile
    if (path.includes("/customers")) {
      const singleMatch = path.match(/\/customers\/([^\/\?]+)$/);
      if (singleMatch) {
        const cId = decodeURIComponent(singleMatch[1]);
        const comp = findCompany(cId) || COMPANIES_LIST[0];
        const custInvoices = mockTransactionsStore
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

        const lastV = mockVisitsStore.find((v) => v.customerId === comp.id || v.customer.toLowerCase() === comp.name.toLowerCase());
        const publicCredit = getCompanyPublicCreditProfile(comp.id);

        return {
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
      }

      // Group counterparties for current user
      const userCompId = currentUser.companyId || currentUser.id;
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

      mockTransactionsStore.forEach((t) => {
        if (currentUser.role !== "Admin" && t.sellerId !== userCompId && t.buyerId !== userCompId) {
          return;
        }

        const targetId = t.sellerId === userCompId ? t.buyerId : t.sellerId;
        const targetEntry = counterpartiesMap[targetId];

        if (targetEntry) {
          const invObj = {
            ...t,
            customerId: t.buyerId,
            customer: t.buyerName,
            direction: t.sellerId === userCompId ? "RECEIVABLE" : "PAYABLE",
            issued: t.issuedDate,
            due: t.dueDate,
          };
          targetEntry.invoices.push(invObj);
          if (t.sellerId === userCompId && t.status !== "Paid") {
            targetEntry.outstanding += t.amount;
            if (t.daysOverdue > 0) targetEntry.overdue += t.amount;
            if (t.priority === "High") targetEntry.high += 1;
          }
        }
      });

      Object.values(counterpartiesMap).forEach((c) => {
        const v = mockVisitsStore.find((item) => item.customerId === c.id || item.customer.toLowerCase() === c.name.toLowerCase());
        if (v) c.lastVisit = v.visit_time || v.date;
      });

      return Object.values(counterpartiesMap);
    }

    // Dashboard Summary
    if (path.includes("/dashboard/summary")) {
      const userCompId = currentUser.companyId || currentUser.id;
      const userTxs = currentUser.role === "Admin"
        ? mockTransactionsStore
        : mockTransactionsStore.filter((t) => t.sellerId === userCompId || t.buyerId === userCompId);

      const receivables = userTxs.filter((t) => currentUser.role === "Admin" || t.sellerId === userCompId);
      const payables = userTxs.filter((t) => t.buyerId === userCompId);

      const unpaidRec = receivables.filter((t) => t.status !== "Paid");
      const unpaidPay = payables.filter((t) => t.status !== "Paid");

      const totalReceivables = unpaidRec.reduce((s, i) => s + i.amount, 0);
      const totalPayables = unpaidPay.reduce((s, i) => s + i.amount, 0);
      const overdueReceivables = unpaidRec.filter((i) => i.daysOverdue > 0).reduce((s, i) => s + i.amount, 0);
      const overduePayables = unpaidPay.filter((i) => i.daysOverdue > 0).reduce((s, i) => s + i.amount, 0);

      return {
        totalOutstanding: totalReceivables,
        totalOverdue: overdueReceivables,
        totalPayables,
        overduePayables,
        netStanding: totalReceivables - totalPayables,
        highPriorityCount: unpaidRec.filter((i) => i.priority === "High").length,
        collectionRate: Math.round(((receivables.length - unpaidRec.length) / (receivables.length || 1)) * 100),
        openInvoiceCount: unpaidRec.length,
        recentVisitsCount: mockVisitsStore.length,
      };
    }

    // NFC lookup
    if (path.includes("/nfc/lookup")) {
      const customer = COMPANIES_LIST[0];
      const inv = mockTransactionsStore.find((i) => i.buyerId === customer.id || i.sellerId === customer.id);
      return { tagId: "COMP001", customerId: customer.id, customer: customer.name, invoice: inv };
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

// Invoices / Transactions API
export async function getInvoices(token) {
  return request("/api/invoices", { token });
}

export async function createInvoice(token, invoiceData) {
  return request("/api/invoices", { method: "POST", token, body: invoiceData });
}

// Customers & Counterparties API
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

// B2B Credit Directory Search API
export async function searchCompanies(query = "", token) {
  return request(`/api/companies/search?q=${encodeURIComponent(query)}`, { token });
}

export async function getCompanyCreditProfile(companyId, token) {
  return request(`/api/companies/${encodeURIComponent(companyId)}/credit-profile`, { token });
}
