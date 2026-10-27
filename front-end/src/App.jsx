
import React, { useState } from "react";

const rooms = [
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

function App() {
  const [page, setPage] = useState("Home");
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]);
  const [name, setName] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [reservations, setReservations] = useState([]);
  const [search, setSearch] = useState("");

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

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(search.toLowerCase())
  );

  function bookRoom(event) {
    event.preventDefault();

    if (!name.trim() || !checkIn || !checkOut) {
      alert("Please complete all reservation details.");
      return;
    }

    if (checkOut <= checkIn) {
      alert("Check-out must be after check-in.");
      return;
    }

    const reservation = {
      id: Date.now(),
      name: name.trim(),
      room: selectedRoom.name,
      price: selectedRoom.price,
      checkIn,
      checkOut,
      guests,
      status: "Pending",
    };

    setReservations((current) => [...current, reservation]);

    setName("");
    setCheckIn("");
    setCheckOut("");
    setGuests("2");
    setPage("Reservations");
  }

  // AI CHATBOT FUNCTION
  async function sendMessage(event) {
    event.preventDefault();

    const userQuestion = question.trim();

    if (!userQuestion || isTyping) return;

    const updatedMessages = [
      ...messages,
      { from: "you", text: userQuestion },
    ];

    setMessages(updatedMessages);
    setQuestion("");
    setIsTyping(true);

    try {
      const response = await fetch(
        "http://localhost:5001/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: updatedMessages
              .filter(
                (message) =>
                  message.from === "you" || message.from === "bot"
              )
              .map((message) => ({
                role:
                  message.from === "you" ? "user" : "assistant",
                content: message.text,
              })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "The AI request failed."
        );
      }

      setMessages((current) => [
        ...current,
        {
          from: "bot",
          text:
            data.reply ||
            "Sorry, I couldn't generate a response. Please try again.",
        },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);

      setMessages((current) => [
        ...current,
        {
          from: "bot",
          text:
            "Sorry! I cannot connect to the AI assistant right now. " +
            "Please check that the AI server is running, then try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div style={styles.app}>
      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <strong style={styles.logo}>ISLAND RESORT</strong>
          <div style={styles.tagline}>
            Relax. Refresh. Reconnect.
          </div>
        </div>

        <nav style={styles.nav}>
          {["Home", "Rooms", "Reservations"].map((item) => (
            <button
              key={item}
              onClick={() => setPage(item)}
              style={{
                ...styles.navButton,
                background:
                  page === item ? "#176b55" : "transparent",
                color: page === item ? "white" : "#183b32",
              }}
            >
              {item}
            </button>
          ))}
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
                      setPage("Book");
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
              onClick={() => setPage("Rooms")}
            >
              Cancel
            </button>
          </form>
        </main>
      )}

      {/* RESERVATIONS PAGE */}
      {page === "Reservations" && (
        <main style={styles.section}>
          <h1>My Reservations</h1>

          {reservations.length === 0 ? (
            <p>
              No reservations have been submitted in this
              session yet.
            </p>
          ) : (
            <div style={styles.grid}>
              {reservations.map((reservation) => (
                <article
                  key={reservation.id}
                  style={styles.cardBody}
                >
                  <h3>{reservation.room}</h3>
                  <p>Guest: {reservation.name}</p>
                  <p>
                    Price: ₱
                    {reservation.price.toLocaleString()} / night
                  </p>
                  <p>Check-in: {reservation.checkIn}</p>
                  <p>Check-out: {reservation.checkOut}</p>
                  <p>Guests: {reservation.guests}</p>
                  <p>Status: {reservation.status}</p>

                  <button
                    onClick={() => {
                      const confirmed = window.confirm(
                        "Are you sure you want to delete this reservation?"
                      );

                      if (confirmed) {
                        setReservations((current) =>
                          current.filter(
                            (item) => item.id !== reservation.id
                          )
                        );
                      }
                    }}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          )}
        </main>
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
                      ? "#176b55"
                      : "#eef2ed",
                  color:
                    message.from === "you"
                      ? "white"
                      : "#183b32",
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
                  background: "#eef2ed",
                  color: "#183b32",
                }}
              >
                <em>AI Assistant is thinking...</em>
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
                cursor:
                  isTyping || !question.trim()
                    ? "not-allowed"
                    : "pointer",
              }}
              type="submit"
              disabled={isTyping || !question.trim()}
            >
              {isTyping ? "..." : "Send"}
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
    color: "#183b32",
    background: "#f7f8f3",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    padding: "22px 6%",
    background: "white",
    borderBottom: "1px solid #e3e8df",
  },

  logo: {
    fontSize: 22,
    letterSpacing: 2,
    color: "#176b55",
  },

  tagline: {
    fontSize: 12,
    marginTop: 5,
    color: "#63746b",
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
      "linear-gradient(90deg, #e3eee5 0%, #e3eee5ee 50%, #e3eee500 100%), url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80') center/cover",
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
    background: "#176b55",
    color: "white",
    cursor: "pointer",
  },

  search: {
    boxSizing: "border-box",
    padding: 12,
    width: "min(100%, 350px)",
    margin: "20px 0",
    border: "1px solid #cbd5ce",
    borderRadius: 8,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 22,
    marginTop: 24,
  },

  card: {
    background: "white",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 5px 20px #183b3210",
  },

  roomImage: {
    width: "100%",
    height: 200,
    objectFit: "cover",
  },

  cardBody: {
    padding: 20,
    background: "white",
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
    border: "1px solid #cbd5ce",
    borderRadius: 8,
  },

  footer: {
    textAlign: "center",
    padding: 30,
    background: "#eaf0e8",
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
    background: "#176b55",
    color: "white",
    cursor: "pointer",
    boxShadow: "0 5px 20px #0002",
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
    background: "white",
    border: "1px solid #dbe4dc",
    borderRadius: 14,
    boxShadow: "0 8px 35px #0002",
  },

  chatHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    paddingBottom: 12,
    borderBottom: "1px solid #e3e8df",
  },

  closeButton: {
    border: 0,
    background: "transparent",
    color: "#183b32",
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
    borderTop: "1px solid #e3e8df",
  },

  chatInput: {
    boxSizing: "border-box",
    flex: 1,
    minWidth: 0,
    padding: 11,
    border: "1px solid #cbd5ce",
    borderRadius: 8,
    outlineColor: "#176b55",
  },

  sendButton: {
    border: 0,
    borderRadius: 8,
    padding: "11px 13px",
    background: "#176b55",
    color: "white",
    cursor: "pointer",
  },

  chatDisclaimer: {
    fontSize: 10,
    color: "#63746b",
    marginBottom: 0,
    textAlign: "center",
  },
};

export default App;

