import React, { useMemo, useState } from "react";
import { CalendarDays, CircleX, Clock3, RotateCcw, Users } from "lucide-react";
import "./ReservationsPage.css";

const filters = [
  { value: "all", label: "All stays" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

function parseLocalDate(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDate(value, options = {}) {
  const date = parseLocalDate(value);
  return date
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", ...options }).format(date)
    : "Date unavailable";
}

function getNightCount(checkIn, checkOut) {
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);
  if (!start || !end || end <= start) return null;
  return Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000);
}

function ReservationsPage({ reservations, onExplore, onRebook, onCancel, cancelConfirmationId, onConfirmCancel, onKeepBooking }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const pendingCount = reservations.filter((booking) => booking.status === "pending").length;
  const confirmedCount = reservations.filter((booking) => booking.status === "confirmed").length;
  const visibleReservations = useMemo(
    () => statusFilter === "all"
      ? reservations
      : reservations.filter((booking) => booking.status === statusFilter),
    [reservations, statusFilter]
  );

  return (
    <main className="reservations-page">
      <header className="reservations-heading">
        <div>
          <span className="reservations-eyebrow">ISLAND RESORT / YOUR STAYS</span>
          <h1>My reservations</h1>
          <p>Keep your trip details close, from request to check-out.</p>
        </div>
        <button className="reservations-explore" type="button" onClick={onExplore}>
          <CalendarDays size={16} aria-hidden="true" />
          Find another stay
        </button>
      </header>

      <section className="reservation-overview" aria-label="Reservation summary">
        <div className="reservation-overview-lead">
          <span className="overview-icon"><CalendarDays size={19} /></span>
          <div>
            <small>All reservations</small>
            <strong>{reservations.length}</strong>
          </div>
        </div>
        <div className="overview-divider" aria-hidden="true" />
        <div className="reservation-overview-item">
          <Clock3 size={17} aria-hidden="true" />
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>
        <div className="reservation-overview-item">
          <span className="confirmed-dot" aria-hidden="true" />
          <span>Confirmed</span>
          <strong>{confirmedCount}</strong>
        </div>
      </section>

      <div className="reservation-list-heading">
        <div>
          <h2>Your stays</h2>
          <p>{visibleReservations.length} {visibleReservations.length === 1 ? "reservation" : "reservations"}</p>
        </div>
        <div className="reservation-filters" role="group" aria-label="Filter reservations">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={statusFilter === filter.value ? "reservation-filter active" : "reservation-filter"}
              onClick={() => setStatusFilter(filter.value)}
              aria-pressed={statusFilter === filter.value}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {visibleReservations.length ? (
        <section className="reservation-list" aria-label="Your reservation list">
          {visibleReservations.map((reservation) => {
            const nights = getNightCount(reservation.checkIn, reservation.checkOut);
            const canCancel = ["pending", "confirmed"].includes(reservation.status);

            return (
              <article className="reservation-item" key={reservation.id}>
                <div className="reservation-item-top">
                  <div className="reservation-room-heading">
                    <span className="reservation-room-mark" aria-hidden="true" />
                    <div>
                      <span className="reservation-reference">RESERVATION</span>
                      <h3>{reservation.room}</h3>
                    </div>
                  </div>
                  <span className={`reservation-status reservation-status-${reservation.status}`}>
                    <span aria-hidden="true" />
                    {reservation.status}
                  </span>
                </div>

                <div className="reservation-stay-details">
                  <div className="stay-date-block">
                    <span>CHECK-IN</span>
                    <strong>{formatDate(reservation.checkIn, { year: "numeric" })}</strong>
                  </div>
                  <div className="stay-duration">
                    <span className="stay-duration-line" />
                    <small>{nights ? `${nights} ${nights === 1 ? "night" : "nights"}` : "Stay"}</small>
                    <span className="stay-duration-line" />
                  </div>
                  <div className="stay-date-block stay-checkout">
                    <span>CHECK-OUT</span>
                    <strong>{formatDate(reservation.checkOut, { year: "numeric" })}</strong>
                  </div>
                </div>

                <div className="reservation-item-bottom">
                  <div className="reservation-meta">
                    <span><Users size={15} aria-hidden="true" /> {reservation.guests} {Number(reservation.guests) === 1 ? "guest" : "guests"}</span>
                    <span className="reservation-rate">₱{Number(reservation.price).toLocaleString()} <small>/ night</small></span>
                  </div>
                  <div className="reservation-actions">
                    <button className="reservation-rebook" type="button" onClick={() => onRebook(reservation)}>
                      <RotateCcw size={15} aria-hidden="true" />
                      {reservation.status === "cancelled" ? "Book again" : "Rebook"}
                    </button>
                    {canCancel && (
                      <button className="reservation-cancel" type="button" onClick={() => onCancel(reservation.id)}>
                        <CircleX size={15} aria-hidden="true" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {cancelConfirmationId === reservation.id && (
                  <div className="reservation-cancel-confirm" role="group" aria-label="Confirm booking cancellation">
                    <p>Cancel this stay? Its dates will become available to other guests.</p>
                    <div>
                      <button type="button" className="confirm-cancel-button" onClick={() => onConfirmCancel(reservation)}>
                        Confirm cancellation
                      </button>
                      <button type="button" className="keep-booking-button" onClick={onKeepBooking}>
                        Keep reservation
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <section className="reservations-empty">
          <span className="empty-calendar"><CalendarDays size={23} aria-hidden="true" /></span>
          <h2>{reservations.length ? "No stays in this category" : "Your next stay starts here"}</h2>
          <p>{reservations.length ? "Choose another filter to see your reservations." : "You don’t have any reservations yet. Find a room and choose dates that suit you."}</p>
          {!reservations.length && (
            <button className="reservations-explore" type="button" onClick={onExplore}>
              Explore rooms
            </button>
          )}
        </section>
      )}
    </main>
  );
}

export default ReservationsPage;