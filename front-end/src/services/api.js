
const API_URL = "http://localhost:5000/api";

export async function getRooms(search = "") {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("q", search.trim());
  }

  const response = await fetch(
    `${API_URL}/rooms?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to load rooms from the server.");
  }

  return response.json();
}

export async function getReservations() {
  const response = await fetch(`${API_URL}/reservations`);

  if (!response.ok) {
    throw new Error("Failed to load reservations.");
  }

  return response.json();
}
