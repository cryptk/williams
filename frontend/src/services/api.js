const API_BASE = "/api/v1";

// Get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem("token");
}

async function fetchAPI(endpoint, options = {}) {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
      throw new Error("Session expired");
    }
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

// Bills API
export async function getBills() {
  return fetchAPI("/bills");
}

export async function getBill(id) {
  return fetchAPI(`/bills/${id}`);
}

export async function createBill(bill) {
  return fetchAPI("/bills", {
    method: "POST",
    body: JSON.stringify(bill),
  });
}

export async function updateBill(id, bill) {
  return fetchAPI(`/bills/${id}`, {
    method: "PUT",
    body: JSON.stringify(bill),
  });
}

export async function deleteBill(id) {
  return fetchAPI(`/bills/${id}`, {
    method: "DELETE",
  });
}

// Payments API
export async function createPayment(billId, payment) {
  return fetchAPI(`/bills/${billId}/payments`, {
    method: "POST",
    body: JSON.stringify(payment),
  });
}

export async function getPayments(billId) {
  return fetchAPI(`/bills/${billId}/payments`);
}

export async function deletePayment(billId, paymentId) {
  return fetchAPI(`/bills/${billId}/payments/${paymentId}`, {
    method: "DELETE",
  });
}

// Categories API
export async function getCategories() {
  return fetchAPI("/categories");
}

export async function createCategory(category) {
  return fetchAPI("/categories", {
    method: "POST",
    body: JSON.stringify(category),
  });
}

export async function deleteCategory(id) {
  return fetchAPI(`/categories/${id}`, {
    method: "DELETE",
  });
}

// Stats API
export async function getStats() {
  return fetchAPI("/stats/summary");
}
