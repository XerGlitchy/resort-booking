import React from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, LogOut, ShieldCheck, UserRound } from "lucide-react";
import "./ProfilePage.css";

function ProfilePage({ user, reservations, onNavigate, onLogOut }) {
  const activeCount = reservations.filter((booking) => ["pending", "confirmed"].includes(booking.status)).length;
  const pendingCount = reservations.filter((booking) => booking.status === "pending").length;
  const confirmedCount = reservations.filter((booking) => booking.status === "confirmed").length;
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const isAdmin = user.role === "admin";

  return (
    <main className="profile-page">
      <header className="profile-heading">
        <div>
          <span className="profile-eyebrow">ISLAND RESORT / ACCOUNT</span>
          <h1>Your profile</h1>
          <p>Manage your account and keep track of your stays.</p>
        </div>
      </header>

      <section className="profile-identity" aria-label="Account information">
        <div className="profile-avatar" aria-hidden="true">{initials || <UserRound size={30} />}</div>
        <div className="profile-identity-copy">
          <div className="profile-name-row">
            <h2>{user.name}</h2>
            <span className={`profile-role ${isAdmin ? "profile-role-admin" : ""}`}>
              {isAdmin && <ShieldCheck size={14} aria-hidden="true" />}
              {isAdmin ? "Administrator" : "Guest account"}
            </span>
          </div>
          <p>{user.email}</p>
        </div>
        <button className="profile-logout" type="button" onClick={onLogOut}>
          <LogOut size={16} aria-hidden="true" />
          Log out
        </button>
      </section>

      <section className="profile-stats" aria-label="Reservation summary">
        <article className="profile-stat">
          <span className="profile-stat-icon"><CalendarDays size={18} /></span>
          <div><small>All reservations</small><strong>{reservations.length}</strong></div>
        </article>
        <article className="profile-stat">
          <span className="profile-stat-icon profile-stat-pending"><Clock3 size={18} /></span>
          <div><small>Awaiting response</small><strong>{pendingCount}</strong></div>
        </article>
        <article className="profile-stat">
          <span className="profile-stat-icon profile-stat-confirmed"><CheckCircle2 size={18} /></span>
          <div><small>Confirmed stays</small><strong>{confirmedCount}</strong></div>
        </article>
      </section>

      <section className="profile-detail-row">
        <div className="profile-details">
          <span className="profile-eyebrow">ACCOUNT DETAILS</span>
          <dl>
            <div><dt>Full name</dt><dd>{user.name}</dd></div>
            <div><dt>Email address</dt><dd>{user.email}</dd></div>
            <div><dt>Account type</dt><dd>{isAdmin ? "Resort administrator" : "Customer"}</dd></div>
          </dl>
        </div>

        <aside className="profile-next-step">
          <span className="profile-eyebrow">YOUR STAYS</span>
          <h2>{activeCount ? `${activeCount} active ${activeCount === 1 ? "reservation" : "reservations"}` : "Plan your next stay"}</h2>
          <p>{activeCount ? "Review dates, check status, or make changes to an eligible booking." : "Browse resort rooms and choose dates that work for you."}</p>
          <button type="button" onClick={() => onNavigate(activeCount ? "Reservations" : "Rooms")}>
            {activeCount ? "View reservations" : "Explore rooms"}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </aside>
      </section>

      {isAdmin && (
        <section className="profile-admin-link" aria-label="Administrator tools">
          <div>
            <span className="profile-eyebrow">ADMINISTRATION</span>
            <h2>Resort operations</h2>
            <p>Review incoming bookings and manage resort availability.</p>
          </div>
          <button type="button" onClick={() => onNavigate("Admin")}>
            Open dashboard
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
      )}
    </main>
  );
}

export default ProfilePage;