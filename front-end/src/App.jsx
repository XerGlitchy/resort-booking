
import React, { useEffect, useState } from "react";
import AdminDashboard from "./AdminDashboard.jsx";
import ProfilePage from "./ProfilePage.jsx";
import ReservationsPage from "./ReservationsPage.jsx";
import SiteNotification from "./SiteNotification.jsx";
import {
  createReservation,
  cancelReservation as cancelReservationRequest,
  deleteReservation,
  getCurrentUser,
  getMyReservations,
  getRooms,
  loginAccount,
  registerAccount,
  sendChatMessages,
} from "./services/api.js";

const initialRooms = [
  {
    id: 1,
    name: "Deluxe Room",
    price: 2500,
    capacity: "2 guests",
    description: "Comfortable room for couples or solo travelers.",
    image:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    name: "Family Villa",
    price: 4500,
    capacity: "4 guests",
    description: "Spacious accommodation for family vacations.",
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    name: "Ocean View Suite",
    price: 3500,
    capacity: "2 guests",
    description: "Relax and enjoy a peaceful resort getaway.",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80",
  },
];

function toCustomerReservation(booking) {
  const populatedRoom = booking.roomId && typeof booking.roomId === "object"
    ? booking.roomId
    : null;
  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);

  return {
    id: booking._id || booking.id,
    roomId: populatedRoom?._id || booking.roomId,
    name: booking.guestName || booking.name || "Guest",
    email: booking.email || "",
    room: populatedRoom?.name || booking.room || "Room",
    price: populatedRoom?.pricePerNight ?? booking.price ?? 0,
    checkIn: Number.isNaN(checkIn.getTime()) ? "" : checkIn.toISOString().slice(0, 10),
    checkOut: Number.isNaN(checkOut.getTime()) ? "" : checkOut.toISOString().slice(0, 10),
    guests: String(booking.guestCount ?? booking.guests ?? 1),
    status: String(booking.status || "pending").toLowerCase(),
  };
}

function App() {
  const [page, setPage] = useState("Home");
  const [rooms, setRooms] = useState(initialRooms);
  const [selectedRoom, setSelectedRoom] = useState(initialRooms[0]);
  const [name, setName] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [reservations, setReservations] = useState([]);
  const [rebookingReservationId, setRebookingReservationId] = useState(null);
  const [cancelConfirmationId, setCancelConfirmationId] = useState(null);
  const [search, setSearch] = useState("");
  const [auth, setAuth] = useState({
    token: sessionStorage.getItem("resortBookingToken") || "",
    user: null,
  });
  const [authLoading, setAuthLoading] = useState(Boolean(sessionStorage.getItem("resortBookingToken")));
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [notification, setNotification] = useState(null);
  const [afterAuthPage, setAfterAuthPage] = useState("Home");

  // AI chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hello! Welcome to Island Resort. How can I help you today?",
    },
  ]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(
      () => setNotification(null),
      notification.type === "error" ? 8000 : 5500
    );
    return () => window.clearTimeout(timer);
  }, [notification]);

  function notify(type, title, message) {
    setNotification({ type, title, message });
  }

  useEffect(() => {
    let active = true;

    getRooms()
      .then((serverRooms) => {
        if (!active || !Array.isArray(serverRooms) || !serverRooms.length) return;
        const mappedRooms = serverRooms.map((room) => {
          const localRoom = initialRooms.find((item) => item.name === room.name);
          return {
            id: room._id,
            backendId: room._id,
            name: room.name,
            price: room.pricePerNight,
            capacity: `${room.capacity} ${room.capacity === 1 ? "guest" : "guests"}`,
            description: room.description || localRoom?.description || "A comfortable resort stay.",
            image: localRoom?.image || initialRooms[0].image,
          };
        });
        setRooms(mappedRooms);
        setSelectedRoom((current) => mappedRooms.find((room) => room.name === current.name) || mappedRooms[0]);
      })
      .catch(() => {
        if (active) notify("error", "Rooms couldn't load", "Check that the booking server is running, then try again.");
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    if (!auth.token) {
      setAuthLoading(false);
      setReservations([]);
      return () => { active = false; };
    }

    setAuthLoading(true);
    Promise.all([getCurrentUser(auth.token), getMyReservations(auth.token)])
      .then(([session, savedReservations]) => {
        if (!active) return;
        setAuth((current) => ({ ...current, user: session.user }));
        setReservations(savedReservations.map(toCustomerReservation));
      })
      .catch(() => {
        if (!active) return;
        sessionStorage.removeItem("resortBookingToken");
        setAuth({ token: "", user: null });
        setReservations([]);
        notify("warning", "Please sign in again", "Your session expired or could not be verified.");
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => { active = false; };
  }, [auth.token]);

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(search.toLowerCase())
  );

  async function bookRoom(event) {
    event.preventDefault();

    if (!name.trim() || !checkIn || !checkOut) {
      notify("warning", "Complete your stay details", "Enter your name and choose check-in and check-out dates.");
      return;
    }

    if (checkOut <= checkIn) {
      notify("warning", "Check your dates", "Check-out must be after check-in.");
      return;
    }

    if (!selectedRoom.backendId) {
      notify("error", "Booking unavailable", "This room isn't connected to the booking server yet.");
      return;
    }

    try {
      const savedBooking = await createReservation({
        roomId: selectedRoom.backendId,
        checkIn,
        checkOut,
        guestCount: Number(guests),
        replaceReservationId: rebookingReservationId || undefined,
      }, auth.token);
      const savedReservation = toCustomerReservation(savedBooking);
      setReservations((current) => [
        ...current.filter((item) => item.id !== rebookingReservationId),
        savedReservation,
      ]);
      setRebookingReservationId(null);
      setName("");
      setCheckIn("");
      setCheckOut("");
      setGuests("2");
      setPage("Reservations");
      notify("success", "Reservation submitted", "Your booking is saved and waiting for resort confirmation.");
    } catch (error) {
      notify("error", "Reservation wasn't saved", error.message || "Please try again.");
    }
  }

  function rebookReservation(reservation) {
    const room = rooms.find((item) => item.backendId === reservation.roomId || item.name === reservation.room);

    if (!room) return;

    setSelectedRoom(room);
    setRebookingReservationId(reservation.status === "pending" ? reservation.id : null);
    setName(reservation.name);
    setGuests(String(reservation.guests));
    setCheckIn("");
    setCheckOut("");
    setPage("Book");
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    try {
      const result = page === "Register"
        ? await registerAccount({ name: authName, email: authEmail, password: authPassword })
        : await loginAccount({ email: authEmail, password: authPassword });
      sessionStorage.setItem("resortBookingToken", result.token);
      setAuth(result);
      setAuthPassword("");
      setPage(afterAuthPage);
      notify("success", page === "Register" ? "Account created" : "You're signed in", page === "Register" ? "Your account is ready. You can now save bookings." : "You can manage your bookings now.");
    } catch (error) {
      notify("error", page === "Register" ? "Account wasn't created" : "Couldn't sign in", error.message || "Please check your details and try again.");
    }
  }

  function logOut() {
    sessionStorage.removeItem("resortBookingToken");
    setAuth({ token: "", user: null });
    setReservations([]);
    setPage("Home");
  }

  async function removeReservation(reservation) {
    try {
      await deleteReservation(reservation.id, auth.token);
      setReservations((current) => current.filter((item) => item.id !== reservation.id));
      notify("success", "Reservation deleted", "The pending booking has been removed.");
    } catch (error) {
      notify("error", "Couldn't delete reservation", error.message || "Please try again.");
    }
  }

  async function cancelBooking(reservation) {
    try {
      const cancelledBooking = await cancelReservationRequest(reservation.id, auth.token);
      const cancelledReservation = toCustomerReservation(cancelledBooking);
      setReservations((current) => current.map((item) => (
        item.id === reservation.id ? cancelledReservation : item
      )));
      setCancelConfirmationId(null);
      notify("success", "Booking cancelled", "Your reservation is cancelled and those dates are available again.");
    } catch (error) {
      setCancelConfirmationId(null);
      notify("error", "Couldn't cancel booking", error.message || "Please try again.");
    }
  }

  async function sendMessage(event) {
    event.preventDefault();

    const userQuestion = question.trim();

    if (!userQuestion || isTyping) return;

    const chatHistory = [
      ...messages.filter((message) => message.from === "you" || message.from === "bot"),
      { from: "you", text: userQuestion },
    ].slice(-10).map((message) => ({
      role: message.from === "you" ? "user" : "assistant",
      content: message.text,
    }));

    setMessages((current) => [...current, { from: "you", text: userQuestion }]);
    setQuestion("");
    setIsTyping(true);

    try {
      const data = await sendChatMessages(chatHistory);
      setMessages((current) => [...current, {
        from: "bot",
        text: data.reply || "The assistant returned an empty response. Please try again.",
      }]);
    } catch (error) {
      setMessages((current) => [...current, {
        from: "bot",
        text: error.message || "The AI assistant could not respond right now. Please try again.",
      }]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div style={styles.app}>
      <SiteNotification
        notification={notification}
        onDismiss={() => setNotification(null)}
      />

      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <strong style={styles.logo}>ISLAND RESORT</strong>
          <div style={styles.tagline}>
            Relax. Refresh. Reconnect.
          </div>
        </div>

        <nav style={styles.nav}>
          {["Home", "Rooms", ...(auth.user ? ["Reservations", "Profile"] : []), ...(auth.user?.role === "admin" ? ["Admin"] : [])].map((item) => (
            <button
              key={item}
              onClick={() => setPage(item)}
              style={{
                ...styles.navButton,
                background:
                  page === item ? "#526a42" : "transparent",
                color: page === item ? "#fffaf2" : "#3f4938",
              }}
            >
              {item}
            </button>
          ))}
          {!auth.user && !authLoading && (
            <>
              <button
                style={styles.navButton}
                onClick={() => {
                  setAfterAuthPage("Home");
                  setPage("Login");
                }}
              >
                Log in
              </button>
              <button
                style={{ ...styles.navButton, background: "#b96346", color: "#fffaf2" }}
                onClick={() => {
                  setAfterAuthPage("Home");
                  setPage("Register");
                }}
              >
                Create account
              </button>
            </>
          )}
          {auth.user && (
            <>
              <button style={styles.navButton} onClick={logOut}>Log out</button>
            </>
          )}
        </nav>
      </header>

      {/* HOME PAGE */}
      {page === "Home" && (
        <main>
          <section style={styles.hero}>
            <div style={styles.heroText}>
              <span style={styles.eyebrow}>
                YOUR NEXT ESCAPE
              </span>

              <h1 style={styles.heroTitle}>
                Find your peaceful getaway.
              </h1>

              <p>
                Discover comfortable rooms and make your next
                vacation memorable.
              </p>

              <button
                style={styles.primaryButton}
                onClick={() => setPage("Rooms")}
              >
                Explore Our Rooms
              </button>
            </div>
          </section>

          <section style={styles.section}>
            <h2>Welcome to Our Resort</h2>
            <p>
              Enjoy a relaxing stay, thoughtful hospitality,
              and a comfortable place to unwind.
            </p>
          </section>
        </main>
      )}

      {/* ROOMS PAGE */}
      {page === "Rooms" && (
        <main style={styles.section}>
          <h1>Explore Our Rooms</h1>
          <p>Choose an accommodation for your next stay.</p>
          <input
            style={styles.search}
            placeholder="Search rooms..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div style={styles.grid}>
            {filteredRooms.map((room) => (
              <article key={room.id} style={styles.card}>
                <img
                  src={room.image}
                  alt={room.name}
                  style={styles.roomImage}
                />

                <div style={styles.cardBody}>
                  <h3>{room.name}</h3>
                  <p>{room.description}</p>
                  <p>{room.capacity}</p>

                  <strong>
                    ₱{room.price.toLocaleString()} / night
                  </strong>

                  <br />

                  <button
                    style={styles.primaryButton}
                    onClick={() => {
                      setSelectedRoom(room);
                      setRebookingReservationId(null);
                      if (auth.user) {
                        setPage("Book");
                      } else {
                        setAfterAuthPage("Book");
                        setPage("Login");
                      }
                    }}
                  >
                    Book This Room
                  </button>
                </div>
              </article>
            ))}
          </div>

          {filteredRooms.length === 0 && (
            <p>No rooms found.</p>
          )}
        </main>
      )}

      {(page === "Login" || page === "Register") && (
        <main style={styles.section}>
          <h1>{page === "Register" ? "Create your account" : "Welcome back"}</h1>
          <p>Sign in to save and manage your resort bookings.</p>
          <form style={styles.form} onSubmit={handleAuthSubmit}>
            {page === "Register" && (
              <label>
                Full name
                <input
                  style={styles.field}
                  value={authName}
                  onChange={(event) => setAuthName(event.target.value)}
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </label>
            )}
            <label>
              Email
              <input
                style={styles.field}
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <input
                style={styles.field}
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                autoComplete={page === "Register" ? "new-password" : "current-password"}
                minLength={8}
                required
              />
            </label>
            <button style={styles.primaryButton} type="submit">
              {page === "Register" ? "Create account" : "Log in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPage(page === "Register" ? "Login" : "Register");
              }}
            >
              {page === "Register" ? "Already have an account? Log in" : "New here? Create an account"}
            </button>
          </form>
        </main>
      )}

      {/* BOOKING PAGE */}
      {page === "Book" && (
        <main style={styles.section}>
          <h1>Reserve Your Stay</h1>

          <p>
            Selected room: <strong>{selectedRoom.name}</strong>
            {" — "}₱{selectedRoom.price.toLocaleString()} per night
          </p>

          <form style={styles.form} onSubmit={bookRoom}>
            <label>
              Full name
              <input
                style={styles.field}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <label>
              Check-in
              <input
                style={styles.field}
                type="date"
                value={checkIn}
                min={new Date().toISOString().split("T")[0]}
                onChange={(event) => setCheckIn(event.target.value)}
                required
              />
            </label>

            <label>
              Check-out
              <input
                style={styles.field}
                type="date"
                value={checkOut}
                min={checkIn || new Date().toISOString().split("T")[0]}
                onChange={(event) => setCheckOut(event.target.value)}
                required
              />
            </label>

            <label>
              Number of guests
              <select
                style={styles.field}
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
              >
                <option value="1">1 guest</option>
                <option value="2">2 guests</option>
                <option value="3">3 guests</option>
                <option value="4">4 guests</option>
                <option value="5">5 guests</option>
              </select>
            </label>

            <button
              style={styles.primaryButton}
              type="submit"
            >
              Submit Reservation
            </button>

            <button
              type="button"
              onClick={() => {
                setRebookingReservationId(null);
                setPage("Rooms");
              }}
            >
              Cancel
            </button>
          </form>
        </main>
      )}

      {/* RESERVATIONS PAGE */}
      {page === "Reservations" && (
        <ReservationsPage
          reservations={reservations}
          onExplore={() => setPage("Rooms")}
          onRebook={rebookReservation}
          onCancel={setCancelConfirmationId}
          cancelConfirmationId={cancelConfirmationId}
          onConfirmCancel={cancelBooking}
          onKeepBooking={() => setCancelConfirmationId(null)}
        />
      )}

      {page === "Admin" && auth.user?.role === "admin" && (
        <AdminDashboard token={auth.token} onNotify={notify} />
      )}

      {page === "Profile" && auth.user && (
        <ProfilePage
          user={auth.user}
          reservations={reservations}
          onNavigate={setPage}
          onLogOut={logOut}
        />
      )}

      {/* FOOTER */}
      <footer style={styles.footer}>
        <strong>Island Resort</strong>
        <p>
          Contact the resort team for assistance with your stay.
        </p>
      </footer>

      {/* CHATBOT OPEN/CLOSE BUTTON */}
      <button
        style={styles.chatButton}
        onClick={() => setChatOpen((open) => !open)}
        aria-label={chatOpen ? "Close resort chat" : "Open resort chat"}
      >
        {chatOpen ? "Close Chat ✕" : "Chat with Us 💬"}
      </button>

      {/* AI CHATBOT PANEL */}
      {chatOpen && (
        <aside style={styles.chatPanel}>
          <div style={styles.chatHeader}>
            <div>
              <h3 style={{ margin: 0 }}>Island Resort</h3>
              <small>AI Assistant</small>
            </div>

            <button
              type="button"
              onClick={() => setChatOpen(false)}
              style={styles.closeButton}
              aria-label="Close chatbot"
            >
              ✕
            </button>
          </div>

          <div style={styles.chatMessages}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  ...styles.message,
                  alignSelf:
                    message.from === "you"
                      ? "flex-end"
                      : "flex-start",
                  background:
                    message.from === "you"
                      ? "#b96346"
                      : "#f2e9db",
                  color:
                    message.from === "you"
                      ? "#fffaf2"
                      : "#3f4938",
                }}
              >
                <strong>
                  {message.from === "you"
                    ? "You"
                    : "AI Assistant"}
                </strong>

                <div style={{ marginTop: 5 }}>
                  {message.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div
                style={{
                  ...styles.message,
                  background: "#f2e9db",
                  color: "#3f4938",
                }}
                role="status"
              >
                <em>Assistant is responding...</em>
              </div>
            )}

          </div>

          <form
            onSubmit={sendMessage}
            style={styles.chatForm}
          >
            <input
              style={styles.chatInput}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about rooms or bookings..."
              aria-label="Your message"
              disabled={isTyping}
            />

            <button
              style={{
                ...styles.sendButton,
                opacity: isTyping || !question.trim() ? 0.6 : 1,
                cursor: isTyping || !question.trim() ? "not-allowed" : "pointer",
              }}
              type="submit"
              disabled={isTyping || !question.trim()}
            >
              {isTyping ? "Sending..." : "Send"}
            </button>
          </form>

          <p style={styles.chatDisclaimer}>
            AI answers may need confirmation from resort staff.
          </p>
        </aside>
      )}
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    color: "#3f4938",
    background: "#f5f0e5",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    padding: "22px 6%",
    background: "#fffaf2",
    borderBottom: "1px solid #e2d8c7",
  },

  logo: {
    fontSize: 22,
    letterSpacing: 2,
    color: "#526a42",
  },

  tagline: {
    fontSize: 12,
    marginTop: 5,
    color: "#817a68",
  },

  nav: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  navButton: {
    border: 0,
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
  },

  hero: {
    minHeight: 390,
    display: "flex",
    alignItems: "center",
    padding: "55px 8%",
    background:
      "linear-gradient(90deg, #efe5d4 0%, #efe5d4ed 50%, #efe5d400 100%), url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80') center/cover",
  },

  heroText: {
    maxWidth: 540,
  },

  eyebrow: {
    letterSpacing: 3,
    fontSize: 12,
    fontWeight: "bold",
  },

  heroTitle: {
    fontSize: "clamp(36px, 5vw, 58px)",
    lineHeight: 1.1,
  },

  section: {
    padding: "45px 6%",
    maxWidth: 1250,
    margin: "auto",
  },

  primaryButton: {
    border: 0,
    borderRadius: 8,
    padding: "12px 17px",
    marginTop: 12,
    background: "#526a42",
    color: "#fffaf2",
    cursor: "pointer",
  },

  search: {
    boxSizing: "border-box",
    padding: 12,
    width: "min(100%, 350px)",
    margin: "20px 0",
    border: "1px solid #d5cbb8",
    borderRadius: 8,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 22,
    marginTop: 24,
  },

  card: {
    background: "#fffaf2",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 5px 20px #493f2d14",
  },

  roomImage: {
    width: "100%",
    height: 200,
    objectFit: "cover",
  },

  cardBody: {
    padding: 20,
    background: "#fffaf2",
    borderRadius: 12,
  },

  form: {
    display: "grid",
    gap: 17,
    maxWidth: 500,
    marginTop: 25,
  },

  field: {
    display: "block",
    boxSizing: "border-box",
    width: "100%",
    padding: 12,
    marginTop: 7,
    border: "1px solid #d5cbb8",
    borderRadius: 8,
  },

  footer: {
    textAlign: "center",
    padding: 30,
    background: "#e8e5d5",
    marginTop: 35,
  },

  chatButton: {
    position: "fixed",
    right: 22,
    bottom: 22,
    zIndex: 1000,
    border: 0,
    borderRadius: 30,
    padding: "14px 20px",
    background: "#b96346",
    color: "#fffaf2",
    cursor: "pointer",
    boxShadow: "0 5px 20px #43382324",
  },

  chatPanel: {
    position: "fixed",
    right: 20,
    bottom: 85,
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    width: "min(360px, calc(100vw - 30px))",
    height: "min(500px, calc(100vh - 120px))",
    padding: 16,
    background: "#fffaf2",
    border: "1px solid #e2d8c7",
    borderRadius: 14,
    boxShadow: "0 8px 35px #43382324",
  },

  chatHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    paddingBottom: 12,
    borderBottom: "1px solid #e2d8c7",
  },

  closeButton: {
    border: 0,
    background: "transparent",
    color: "#3f4938",
    fontSize: 18,
    cursor: "pointer",
  },

  chatMessages: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "14px 2px",
  },

  message: {
    maxWidth: "85%",
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 14,
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },

  chatForm: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    borderTop: "1px solid #e2d8c7",
  },

  chatInput: {
    boxSizing: "border-box",
    flex: 1,
    minWidth: 0,
    padding: 11,
    border: "1px solid #d5cbb8",
    borderRadius: 8,
    outlineColor: "#526a42",
  },

  sendButton: {
    border: 0,
    borderRadius: 8,
    padding: "11px 13px",
    background: "#526a42",
    color: "#fffaf2",
    cursor: "pointer",
  },

  chatDisclaimer: {
    fontSize: 10,
    color: "#817a68",
    marginBottom: 0,
    textAlign: "center",
  },
};

export default App;

