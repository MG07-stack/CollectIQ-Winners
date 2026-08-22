// Central place for every call to the backend.
// Set VITE_API_URL in a .env file if your backend isn't on localhost:5000.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
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
