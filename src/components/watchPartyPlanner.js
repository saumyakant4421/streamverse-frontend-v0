import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  FaUsers,
  FaGlobe,
  FaLock,
  FaClock,
  FaSync,
  FaArrowRight,
  FaComment,
  FaPlay,
} from "react-icons/fa";
import WatchPartySearchBar from "./watchpartySearchBar";
import { watchPartyService } from "../lib/services"; // Import watchPartyService
import "../styles/watchparty.scss";
import "../styles/calendar.scss";

const WatchPartyPlanner = () => {
  const { user } = useAuth();
  const [watchParties, setWatchParties] = useState([]);
  const [publicWatchParties, setPublicWatchParties] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toLocaleString("default", { month: "long", year: "numeric" })
  );
  const [form, setForm] = useState({
    title: "",
    description: "",
    dateTime: "",
    movieIds: [],
    selectedMovies: [],
    isPublic: false,
    invitedUserIds: [],
  });
  const calendarRef = useRef(null);

  const fetchWatchParties = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await watchPartyService.get("/user");
      if (!Array.isArray(response.data)) {
        throw new Error("Invalid watch parties data");
      }
      setWatchParties(response.data);
    } catch (err) {
      console.error("Error fetching watch parties:", err.message);
      setError("Failed to load watch parties");
      toast.error("Failed to fetch watch parties");
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicWatchParties = async () => {
    try {
      const response = await watchPartyService.get("/public");
      if (!Array.isArray(response.data)) {
        throw new Error("Invalid public watch parties data");
      }
      setPublicWatchParties(response.data);
    } catch (err) {
      console.error("Error fetching public watch parties:", err.message);
      toast.error("Failed to fetch public watch parties");
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await watchPartyService.get("/notifications");
      if (!Array.isArray(response.data)) {
        throw new Error("Invalid notifications data");
      }
      setNotifications(response.data);
    } catch (err) {
      console.error("Error fetching notifications:", err.message);
      toast.error("Failed to fetch notifications");
    }
  };

  const createWatchParty = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to create a watch party");
      return;
    }
    const { title, dateTime, movieIds } = form;
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!dateTime) {
      toast.error("Date and time are required");
      return;
    }
    if (movieIds.length === 0) {
      toast.error("Please select at least one movie");
      return;
    }
    if (movieIds.some((id) => !id || isNaN(parseInt(id)))) {
      toast.error("Invalid movie selections");
      return;
    }
    const payload = {
      title: form.title,
      description: form.description,
      dateTime: new Date(dateTime).toISOString(),
      movieIds: form.movieIds.map((id) => parseInt(id)),
      isPublic: form.isPublic,
      invitedUserIds: form.invitedUserIds.filter((id) => id.trim()),
    };
    try {
      setLoading(true);
      setError(null);
      
      const response = await watchPartyService.post("/create", payload);
      if (!response.data.id || typeof response.data.id !== "string") {
        throw new Error("Invalid watch party ID");
      }
      setWatchParties([...watchParties, response.data]);
      setForm({
        title: "",
        description: "",
        dateTime: "",
        movieIds: [],
        selectedMovies: [],
        isPublic: false,
        invitedUserIds: [],
      });
      toast.success("Watch party created successfully");
    } catch (err) {
      console.error("Error creating watch party:", err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to create watch party. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const joinWatchParty = async (watchPartyId) => {
    if (!user) {
      toast.error("Please log in to join a watch party");
      return;
    }
    if (
      !watchPartyId ||
      typeof watchPartyId !== "string" ||
      watchPartyId.length < 6
    ) {
      toast.error("Invalid watch party ID");
      return;
    }
    try {
      setLoading(true);
      const response = await watchPartyService.post(`/join/${watchPartyId}`);
      setWatchParties([...watchParties, response.data]);
      setNotifications(
        notifications.filter((n) => n.watchPartyId !== watchPartyId)
      );
      toast.success("Joined watch party successfully");
    } catch (err) {
      console.error("Error joining watch party:", err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to join watch party. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startWatchParty = (party) => {
    toast.info(`Starting watch party: ${party.title}`);
    
  };

  const handleEventClick = (info) => {
    const party = watchParties.find(
      (p) => p.id === info.event.extendedProps.watchPartyId
    );
    if (party) {
      window.location.href = `/watchparty/chat/${party.id}`;
    }
  };

  const handleEventMouseEnter = (info) => {
    const tooltip = document.createElement("div");
    tooltip.className = "fc-tooltip";
    tooltip.style.position = "absolute";
    tooltip.style.background = "rgba(0, 0, 0, 0.8)";
    tooltip.style.color = "#fff";
    tooltip.style.padding = "8px";
    tooltip.style.borderRadius = "4px";
    tooltip.style.fontSize = "12px";
    tooltip.style.zIndex = "1000";
    tooltip.style.top = `${info.jsEvent.pageY + 10}px`;
    tooltip.style.left = `${info.jsEvent.pageX + 10}px`;
    tooltip.innerHTML = `
      <strong>${info.event.title}</strong><br />
      ${info.event.extendedProps.description || "No description"}<br />
      Participants: ${info.event.extendedProps.participantCount || 0}<br />
      ${info.event.extendedProps.isPublic ? "Public" : "Private"}
    `;
    document.body.appendChild(tooltip);
    info.el.tooltip = tooltip;
  };

  const handleEventMouseLeave = (info) => {
    if (info.el.tooltip) {
      info.el.tooltip.remove();
      info.el.tooltip = null;
    }
  };

  const getCalendarEvents = () => {
    return watchParties
      .map((party) => {
        if (!party.title || !party.id || !party.dateTime) {
          console.error("Invalid party for calendar event:", party);
          return null;
        }
        let startDate;
        try {
          if (
            party.dateTime &&
            typeof party.dateTime === "object" &&
            "_seconds" in party.dateTime &&
            "_nanoseconds" in party.dateTime
          ) {
            startDate = new Date(
              party.dateTime._seconds * 1000 +
                party.dateTime._nanoseconds / 1000000
            );
          } else if (
            party.dateTime?.toDate &&
            typeof party.dateTime.toDate === "function"
          ) {
            startDate = party.dateTime.toDate();
          } else if (typeof party.dateTime === "string") {
            startDate = new Date(party.dateTime);
          } else {
            throw new Error("Unrecognized dateTime format");
          }
          if (isNaN(startDate.getTime())) {
            console.error(
              "Invalid dateTime for party:",
              JSON.stringify(party, null, 2),
              "dateTime:",
              party.dateTime
            );
            return null;
          }
        } catch (err) {
          console.error(
            "Error parsing dateTime for party:",
            JSON.stringify(party, null, 2),
            "dateTime:",
            party.dateTime,
            "error:",
            err.message
          );
          return null;
        }
        const duration = (party.movies || []).reduce(
          (sum, m) => sum + (m.runtime || 120),
          0
        );
        return {
          id: party.id,
          title: party.title,
          start: startDate,
          end: new Date(startDate.getTime() + duration * 60000),
          extendedProps: {
            watchPartyId: party.id,
            description: party.description || "",
            isPublic: party.isPublic,
            participantCount: party.participants?.length || 0,
          },
          classNames: [party.isPublic ? "fc-event-public" : "fc-event-private"],
          display: "block",
        };
      })
      .filter((event) => event !== null);
  };

  const isPartyExpired = (party) => {
    let startDate;
    try {
      if (
        party.dateTime &&
        typeof party.dateTime === "object" &&
        "_seconds" in party.dateTime &&
        "_nanoseconds" in party.dateTime
      ) {
        startDate = new Date(
          party.dateTime._seconds * 1000 + party.dateTime._nanoseconds / 1000000
        );
      } else if (
        party.dateTime?.toDate &&
        typeof party.dateTime.toDate === "function"
      ) {
        startDate = party.dateTime.toDate();
      } else if (typeof party.dateTime === "string") {
        startDate = new Date(party.dateTime);
      } else {
        throw new Error("Unrecognized dateTime format");
      }
      if (isNaN(startDate.getTime())) {
        console.error("Invalid dateTime in isPartyExpired:", party.dateTime);
        return true;
      }
    } catch (err) {
      console.error(
        "Error parsing dateTime in isPartyExpired:",
        party.dateTime,
        "error:",
        err.message
      );
      return true;
    }
    const duration = (party.movies || []).reduce(
      (sum, m) => sum + (m.runtime || 120),
      0
    );
    const endTime = startDate.getTime() + duration * 60000;
    return endTime < Date.now();
  };

  const handleMovieSelect = (movie) => {
    if (form.movieIds.includes(movie.id.toString())) {
      toast.info("Movie already selected");
      return;
    }
    setForm({
      ...form,
      movieIds: [...form.movieIds, movie.id.toString()],
      selectedMovies: [
        ...form.selectedMovies,
        {
          id: movie.id,
          title: movie.title,
          runtime: movie.runtime || 120,
          poster_path: movie.poster_path,
        },
      ],
    });
  };

  const handleMovieRemove = (movieId) => {
    setForm({
      ...form,
      movieIds: form.movieIds.filter((id) => id !== movieId),
      selectedMovies: form.selectedMovies.filter(
        (movie) => movie.id.toString() !== movieId
      ),
    });
  };

  const CustomToolbar = ({ currentMonth, setCurrentMonth }) => {
    const jumpToToday = () => {
      if (calendarRef.current) {
        calendarRef.current.getApi().today();
        const date = calendarRef.current.getApi().getDate();
        setCurrentMonth(
          date.toLocaleString("default", { month: "long", year: "numeric" })
        );
      }
    };

    const jumpToNextParty = () => {
      const upcomingParties = watchParties
        .filter((party) => {
          let partyDate;
          try {
            if (
              party.dateTime &&
              typeof party.dateTime === "object" &&
              "_seconds" in party.dateTime
            ) {
              partyDate = new Date(
                party.dateTime._seconds * 1000 +
                  party.dateTime._nanoseconds / 1000000
              );
            } else if (party.dateTime.toDate) {
              partyDate = party.dateTime.toDate();
            } else {
              partyDate = new Date(party.dateTime);
            }
            return partyDate > new Date();
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          const dateA = a.dateTime._seconds
            ? new Date(a.dateTime._seconds * 1000)
            : a.dateTime.toDate
            ? a.dateTime.toDate()
            : new Date(a.dateTime);
          const dateB = b.dateTime._seconds
            ? new Date(b.dateTime._seconds * 1000)
            : b.dateTime.toDate
            ? b.dateTime.toDate()
            : new Date(b.dateTime);
          return dateA - dateB;
        });
      if (upcomingParties.length > 0 && calendarRef.current) {
        const nextPartyDate = upcomingParties[0].dateTime._seconds
          ? new Date(upcomingParties[0].dateTime._seconds * 1000)
          : upcomingParties[0].dateTime.toDate
          ? upcomingParties[0].dateTime.toDate()
          : new Date(upcomingParties[0].dateTime);
        if (!isNaN(nextPartyDate.getTime())) {
          calendarRef.current.getApi().gotoDate(nextPartyDate);
          setCurrentMonth(
            nextPartyDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })
          );
        }
      } else {
        toast.info("No upcoming watch parties");
      }
    };

    const handlePrev = () => {
      if (calendarRef.current) {
        calendarRef.current.getApi().prev();
        const date = calendarRef.current.getApi().getDate();
        setCurrentMonth(
          date.toLocaleString("default", { month: "long", year: "numeric" })
        );
      }
    };

    const handleNext = () => {
      if (calendarRef.current) {
        calendarRef.current.getApi().next();
        const date = calendarRef.current.getApi().getDate();
        setCurrentMonth(
          date.toLocaleString("default", { month: "long", year: "numeric" })
        );
      }
    };

    return (
      <div className="custom-toolbar">
        <span className="toolbar-btn-group toolbar-btn-group-left">
          <button onClick={handlePrev}>Previous</button>
          <button onClick={jumpToToday} className="today-btn">
            Today
          </button>
          <button onClick={handleNext}>Next</button>
        </span>
        <span className="toolbar-month">{currentMonth}</span>
        <span className="toolbar-btn-group toolbar-btn-group-right">
          <button onClick={jumpToNextParty} title="Jump to Next Watch Party">
            <FaArrowRight />
          </button>
          <button onClick={fetchWatchParties} title="Refresh">
            <FaSync />
          </button>
        </span>
      </div>
    );
  };

  useEffect(() => {
    if (user) {
      fetchWatchParties();
      fetchPublicWatchParties();
      fetchNotifications();
    } else {
      setWatchParties([]);
      setPublicWatchParties([]);
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().refetchEvents();
    }
  }, [watchParties]);

  if (!user) {
    return (
      <div className="tools-watchparty-planner">
        <h2>Watch Party Scheduler</h2>
        <p>Please log in to create or join watch parties.</p>
      </div>
    );
  }

  return (
    <div className="tools-watchparty-planner">
      {error && <div className="tools-error">{error}</div>}
      {loading && <div className="tools-spinner">Loading...</div>}

      <div className="tools-watchparty-form">
        <h3>Create Watch Party</h3>
        <form onSubmit={createWatchParty}>
          <input
            type="text"
            placeholder="Party Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            type="datetime-local"
            value={form.dateTime}
            onChange={(e) => setForm({ ...form, dateTime: e.target.value })}
            required
          />
          <div className="movie-search-container">
            <WatchPartySearchBar
              placeholder="Search for movies..."
              onMovieSelect={handleMovieSelect}
            />
            {form.selectedMovies.length > 0 && (
              <div className="selected-movies">
                {form.selectedMovies.map((movie) => (
                  <div key={movie.id} className="movie-pill">
                    <span>{movie.title}</span>
                    <button
                      type="button"
                      className="remove-movie-btn"
                      onClick={() => handleMovieRemove(movie.id.toString())}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <label>
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
            />
            Public Watch Party
          </label>
          <input
            type="text"
            placeholder="Invite User IDs (comma-separated)"
            value={form.invitedUserIds.join(",")}
            onChange={(e) =>
              setForm({
                ...form,
                invitedUserIds: e.target.value
                  .split(",")
                  .map((id) => id.trim())
                  .filter((id) => id),
              })
            }
          />
          <button type="submit" disabled={loading}>
            Create Party
          </button>
        </form>
      </div>

      <div className="tools-watchparty-list">
        <h3>Your Watch Parties</h3>
        {watchParties.length === 0 && !loading && !error && (
          <p>No watch parties scheduled. Create one above!</p>
        )}
        <div className="watchparty-grid">
          {watchParties
            .sort((a, b) => {
              const dateA = a.dateTime._seconds
                ? new Date(a.dateTime._seconds * 1000)
                : a.dateTime.toDate
                ? a.dateTime.toDate()
                : new Date(a.dateTime);
              const dateB = b.dateTime._seconds
                ? new Date(b.dateTime._seconds * 1000)
                : b.dateTime.toDate
                ? b.dateTime.toDate()
                : new Date(b.dateTime);
              return dateA - dateB;
            })
            .map((party) => {
              const partyDate = party.dateTime._seconds
                ? new Date(party.dateTime._seconds * 1000)
                : party.dateTime.toDate
                ? party.dateTime.toDate()
                : new Date(party.dateTime);
              const isExpired = isPartyExpired(party);
              return (
                <div
                  key={party.id}
                  className={`watchparty-item ${isExpired ? "expired" : ""}`}
                >
                  <h4>{party.title}</h4>
                  <p>{party.description || "No description"}</p>
                  <p>{partyDate.toLocaleString()}</p>
                  <div className="watchparty-meta">
                    <span>
                      {party.isPublic ? (
                        <FaGlobe size={12} />
                      ) : (
                        <FaLock size={12} />
                      )}
                      {party.isPublic ? " Public" : " Private"}
                    </span>
                    <span>
                      <FaUsers size={12} /> {party.participants?.length || 0}
                    </span>
                    {party.movies?.length > 0 && (
                      <span>
                        <FaClock size={12} />{" "}
                        {party.movies.reduce(
                          (sum, m) => sum + (m.runtime || 120),
                          0
                        )}{" "}
                        min
                      </span>
                    )}
                  </div>
                  {isExpired && (
                    <div className="watchparty-status">Expired/Closed</div>
                  )}
                  <div className="watchparty-movies">
                    {party.movies?.map((movie) => (
                      <span key={movie.id} className="movie-title">
                        {movie.title}
                      </span>
                    ))}
                  </div>
                  <div className="watchparty-actions">
                    <Link
                      to={`/watchparty/chat/${party.id}`}
                      className="watchparty-action-button"
                    >
                      <FaComment /> Join Chat
                    </Link>
                    {party.hostId === user.uid && !isExpired && (
                      <button
                        onClick={() => startWatchParty(party)}
                        className="watchparty-action-button"
                      >
                        <FaPlay /> Start
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="tools-watchparty-calendar">
        <h3>Calendar View</h3>
        <CustomToolbar
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
        />
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={getCalendarEvents()}
          eventClick={handleEventClick}
          eventMouseEnter={handleEventMouseEnter}
          eventMouseLeave={handleEventMouseLeave}
          eventContent={(arg) => (
            <div>
              <b>{arg.event.title}</b>
              <div>
                <FaUsers size={10} /> {arg.event.extendedProps.participantCount}
              </div>
            </div>
          )}
          height="auto"
          dayMaxEvents={3}
          moreLinkContent={({ num }) => `+${num} more`}
          datesSet={(dateInfo) => {
            setCurrentMonth(
              dateInfo.view.currentStart.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })
            );
          }}
        />
      </div>

      <div className="tools-watchparty-public">
        <h3>Public Watch Parties</h3>
        {publicWatchParties.length === 0 && (
          <p>No public watch parties available.</p>
        )}
        <div className="watchparty-grid">
          {publicWatchParties.map((party) => {
            const partyDate = party.dateTime._seconds
              ? new Date(party.dateTime._seconds * 1000)
              : party.dateTime.toDate
              ? party.dateTime.toDate()
              : new Date(party.dateTime);
            const isExpired = isPartyExpired(party);
            const isJoined = party.participants?.includes(user.uid);
            return (
              <div
                key={party.id}
                className={`tools-watchparty-item ${
                  isExpired ? "expired" : ""
                }`}
              >
                <h4>{party.title}</h4>
                <p>{party.description}</p>
                <p>{partyDate.toLocaleString()}</p>
                <div className="watchparty-meta">
                  <span>
                    <FaGlobe size={12} /> Public
                  </span>
                  <span>
                    <FaUsers size={12} /> {party.participants?.length || 0}
                  </span>
                  {party.movies?.length > 0 && (
                    <span>
                      <FaClock size={12} />{" "}
                      {party.movies.reduce(
                        (sum, m) => sum + (m.runtime || 120),
                        0
                      )}{" "}
                      min
                    </span>
                  )}
                </div>
                {isExpired && (
                  <div className="watchparty-status">Expired/Closed</div>
                )}
                <div className="watchparty-actions">
                  {!isJoined && !isExpired && (
                    <button
                      onClick={() => joinWatchParty(party.id)}
                      className="watchparty-action-button"
                    >
                      Join
                    </button>
                  )}
                  {isJoined && (
                    <Link
                      to={`/watchparty/chat/${party.id}`}
                      className="watchparty-action-button"
                    >
                      <FaComment /> Join Chat
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="tools-watchparty-notifications">
        <h3>Notifications</h3>
        {notifications.length === 0 && <p>No notifications.</p>}
        {notifications.map((notification) => (
          <div key={notification.id} className="tools-notification-item">
            <p>{notification.message}</p>
            {notification.type === "watchPartyInvite" && (
              <button
                onClick={() => joinWatchParty(notification.watchPartyId)}
                disabled={watchParties.some(
                  (p) =>
                    p.id === notification.watchPartyId &&
                    p.participants.includes(user.uid)
                )}
                className="watchparty-action-button"
              >
                Accept Invite
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchPartyPlanner;
