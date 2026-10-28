
const API_URL = "http://localhost:5000/api";

async function request(path, { token, ...options } = {}) {
  const headers = { ...options.headers };
  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || "The request could not be completed.");
  return data;
}

export async function getRooms(search = "") {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("q", search.trim());
  }

  return request(`/rooms?${params.toString()}`);
}

export function registerAccount(details) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(details),
  });
}

export function loginAccount(details) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(details),
  });
}

export function getCurrentUser(token) {
  return request("/auth/me", { token });
}

export function getMyReservations(token) {
  return request("/reservations/mine", { token });
}

export function createReservation(details, token) {
  return request("/reservations", {
    method: "POST",
    token,
    body: JSON.stringify(details),
  });
}

export function getReservations(token) {
  return request("/reservations", { token });
}

export function acceptReservation(id, token) {
  return request(`/reservations/${id}/accept`, {
    method: "PATCH",
    token,
  });
}

export function cancelReservation(id, token) {
  return request(`/reservations/${id}/cancel`, {
    method: "PATCH",
    token,
  });
}

export function deleteReservation(id, token) {
  return request(`/reservations/${id}`, {
    method: "DELETE",
    token,
  });
}

export function sendChatMessages(messages) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}
