import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Clock3, RefreshCw, Search, Users } from "lucide-react";
import { acceptReservation, getReservations } from "./services/api.js";
import "./AdminDashboard.css";

function displayDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function normalizeBooking(booking, source) {
  const room = booking.roomId;
  return {
    id: booking._id || booking.id,
    guest: booking.guestName || booking.name || "Guest",
    email: booking.email || "—",
    room: typeof room === "object" ? room?.name || "Room" : booking.room || "Room",
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guestCount ?? booking.guests ?? 0,
    status: String(booking.status || "pending").toLowerCase(),
    source,
  };
}

function AdminDashboard({ token, onNotify }) {
  const [storedReservations, setStoredReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [acceptingId, setAcceptingId] = useState("");

  async function loadReservations() {
    setLoading(true);
    setError("");
    try {
      const data = await getReservations(token);
      setStoredReservations(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message || "Could not load saved bookings.");
      onNotify("error", "Bookings couldn't load", requestError.message || "Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReservations();
  }, [token]);

  const bookings = useMemo(
    () => storedReservations.map((booking) => normalizeBooking(booking, "Saved")),
    [storedReservations]
  );

  async function acceptBooking(bookingId) {
    setAcceptingId(bookingId);
    setError("");
    try {
      await acceptReservation(bookingId, token);
      await loadReservations();
      onNotify("success", "Booking accepted", "The reservation is confirmed and the dates are now unavailable to other guests.");
    } catch (requestError) {
      setError(requestError.message || "Could not accept this booking.");
      onNotify("error", "Booking wasn't accepted", requestError.message || "Please try again.");
    } finally {
      setAcceptingId("");
    }
  }

  const visibleBookings = bookings.filter((booking) => {
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [booking.guest, booking.email, booking.room].some((value) => value.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });
  const pendingCount = bookings.filter((booking) => booking.status === "pending").length;
  const confirmedCount = bookings.filter((booking) => booking.status === "confirmed").length;
  const upcomingCount = bookings.filter((booking) => {
    const daysUntilArrival = (new Date(booking.checkIn) - new Date().setHours(0, 0, 0, 0)) / 86400000;
    return daysUntilArrival >= 0 && daysUntilArrival <= 7 && booking.status !== "cancelled";
  }).length;

  return (
    <main className="admin-dashboard">
      <section className="admin-heading">
        <div>
          <span className="admin-eyebrow">ISLAND RESORT / OPERATIONS</span>
          <h1>Booking overview</h1>
          <p>Reservation activity and upcoming guest stays.</p>
        </div>
        <button className="admin-refresh" type="button" onClick={loadReservations} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </section>

      {error && <div className="admin-notice" role="status">{error}</div>}

      <section className="admin-metrics" aria-label="Booking summary">
        <article className="admin-metric"><span className="metric-icon"><CalendarDays size={18} /></span><span className="metric-label">Total bookings</span><strong>{bookings.length}</strong><small>Saved and current session</small></article>
        <article className="admin-metric"><span className="metric-icon metric-pending"><Clock3 size={18} /></span><span className="metric-label">Awaiting confirmation</span><strong>{pendingCount}</strong><small>Pending reservations</small></article>
        <article className="admin-metric"><span className="metric-icon metric-confirmed"><Check size={18} /></span><span className="metric-label">Confirmed stays</span><strong>{confirmedCount}</strong><small>Ready for arrival</small></article>
        <article className="admin-metric"><span className="metric-icon metric-arrivals"><Users size={18} /></span><span className="metric-label">Arrivals this week</span><strong>{upcomingCount}</strong><small>Next 7 days</small></article>
      </section>

      <section className="admin-bookings">
        <div className="admin-bookings-heading">
          <div><h2>Reservations</h2><p>{visibleBookings.length} shown · data is read-only</p></div>
          <div className="admin-controls">
            <label className="admin-search">
              <Search size={16} aria-hidden="true" />
              <input type="search" placeholder="Search guest, room, email" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search bookings" />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by booking status">
              <option value="all">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Guest</th><th>Room</th><th>Stay</th><th>Guests</th><th>Status</th><th>Record</th><th>Action</th></tr></thead>
            <tbody>
              {visibleBookings.map((booking, index) => (
                <tr key={`${booking.id || booking.guest}-${index}`}>
                  <td><strong>{booking.guest}</strong><small>{booking.email}</small></td>
                  <td>{booking.room}</td>
                  <td><strong>{displayDate(booking.checkIn)}</strong><small>to {displayDate(booking.checkOut)}</small></td>
                  <td>{booking.guests}</td>
                  <td><span className={`booking-status status-${booking.status}`}>{booking.status}</span></td>
                  <td><span className="booking-source">{booking.source}</span></td>
                  <td>
                    {booking.status === "pending" && (
                      <button
                        className="admin-accept-btn"
                        type="button"
                        onClick={() => acceptBooking(booking.id)}
                        disabled={acceptingId === booking.id}
                      >
                        {acceptingId === booking.id ? "Accepting…" : "Accept"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!visibleBookings.length && <tr><td className="admin-empty" colSpan="7">{loading ? "Loading reservations…" : "No bookings match these filters."}</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="admin-footnote">This dashboard does not change reservation records.</p>
      </section>
    </main>
  );
}

export default AdminDashboard;