// CollectIQ API Client with JWT Authentication

const API_BASE = import.meta.env.VITE_API_URL || "";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = API_BASE ? `${API_BASE}${path}` : path;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (netErr) {
    throw new Error(
      "Unable to connect to the CollectIQ server. Please ensure the backend is running."
    );
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
      `Request failed with status ${res.status}`;
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
      password,
      full_name: fullName,
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
