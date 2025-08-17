import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/recommendpage.scss";
import {
  FiRefreshCw,
  FiSend,
  FiRotateCcw,
  FiThumbsUp,
  FiThumbsDown,
} from "react-icons/fi";
import { getAuth } from "firebase/auth";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { recommendationService } from "../lib/services"; // Import recommendationService

const MAX_RETRIES = 3;

const RecommendPage = () => {
  const [activeTab, setActiveTab] = useState("personalized");
  const [personalizedRecommendations, setPersonalizedRecommendations] =
    useState([]);
  const [chatRecommendations, setChatRecommendations] = useState([]);
  const [chatQuery, setChatQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatBotResponseText, setChatBotResponseText] = useState(
    "Hello! I'm MovieAI. Ask me for movie recommendations!"
  );
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user ? user.uid : null;
  const chatContainerRef = useRef(null);

  const setupAuthToken = async () => {
    if (!user) {
      console.log("No user authenticated");
      setError("Please log in to get recommendations");
      return false;
    }
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken(true);
      if (!token) throw new Error("Failed to retrieve ID token");
      console.log("Auth token retrieved successfully");
      return true;
    } catch (error) {
      console.error("Error getting auth token:", error.message);
      setError("Authentication failed. Please log in again.");
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initializeAuthAndFetch = async () => {
      const tokenSet = await setupAuthToken();
      if (isMounted && tokenSet && userId && activeTab === "personalized") {
        fetchPersonalizedRecommendations();
      }
    };
    initializeAuthAndFetch();

    if (userId) {
      console.log(
        `Setting up Firestore listener for chat history for user: ${userId}`
      );
      const unsubscribe = onSnapshot(
        collection(db, "chat_history", userId, "messages"),
        (snapshot) => {
          const messages = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({ id: doc.id, ...data });
          });
          if (isMounted) {
            setChatHistory(
              messages.sort(
                (a, b) =>
                  (a.timestamp?.toMillis() || 0) -
                  (b.timestamp?.toMillis() || 0)
              )
            );
            if (messages.length > 0) {
              const latestBotResponse =
                messages[messages.length - 1].text_response;
              const latestBotRecommendations =
                messages[messages.length - 1].bot || [];
              setChatBotResponseText(
                latestBotResponse || "Here are your movie recommendations!"
              );
              setChatRecommendations(latestBotRecommendations);
            }
          }
        },
        (err) => {
          console.error(
            "Firestore error fetching chat history:",
            err.code,
            err.message
          );
          if (isMounted)
            setError(`Failed to fetch chat history: ${err.message}`);
        }
      );
      return () => {
        console.log("Unsubscribing from Firestore snapshot");
        unsubscribe();
        isMounted = false;
      };
    }

    return () => {
      isMounted = false;
    };
  }, [user, activeTab, userId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, chatRecommendations]);

  const fetchPersonalizedRecommendations = async () => {
    if (!userId) {
      setError("Please log in to get personalized recommendations");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tokenSet = await setupAuthToken();
      if (!tokenSet) throw new Error("Token setup failed");
      const response = await recommendationService.post(
        "/personalized",
        { userId },
        { timeout: 120000 }
      );
      const recs = Array.isArray(response.data) ? response.data : [];
      console.log("Personalized recommendations for user", userId, ":", recs);
      setPersonalizedRecommendations(recs);
    } catch (error) {
      console.error(
        "Error fetching personalized recommendations:",
        error.message,
        error.response?.status,
        error.response?.data
      );
      setError(
        `Failed to fetch recommendations: ${error.message}. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchChatRecommendations = async () => {
    if (!userId || !chatQuery.trim()) {
      setError("Please log in and enter a query");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tokenSet = await setupAuthToken();
      if (!tokenSet) throw new Error("Token setup failed");
      console.log("Sending chat request for user", userId, ":", chatQuery);

      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now(),
          user: chatQuery,
          timestamp: { toMillis: () => Date.now() },
        },
      ]);
      setChatQuery("");

      const response = await recommendationService.post(
        "/chat",
        { userId, query: chatQuery },
        { timeout: 120000 }
      );
      const recs = Array.isArray(response.data.recommendations)
        ? response.data.recommendations
        : [];
      const textResponse =
        response.data.text_response || "Here are your movie recommendations!";
      console.log("Chat recommendations for user", userId, ":", recs);

      setChatRecommendations(recs);
      setChatBotResponseText(textResponse);

      setRetryCount(0);
    } catch (error) {
      console.error(
        "Error fetching chat recommendations:",
        error.message,
        error.response?.status,
        error.response?.data
      );
      if (error.code === "ECONNABORTED" && retryCount < MAX_RETRIES) {
        console.log(
          `Retrying chat recommendations (attempt ${
            retryCount + 1
          }/${MAX_RETRIES})`
        );
        setRetryCount(retryCount + 1);
        setTimeout(() => fetchChatRecommendations(), 1000 * (retryCount + 1));
      } else {
        const errorMessage =
          error.response?.data?.error ||
          `Failed to fetch chat recommendations: ${error.message}`;
        setError(errorMessage);
        setChatBotResponseText(errorMessage);
        setChatRecommendations([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (movieId, feedback) => {
    if (!userId || !movieId) return;
    try {
      await addDoc(collection(db, "feedback", userId, "ratings"), {
        movieId,
        feedback,
        timestamp: serverTimestamp(),
      });
      console.log(`Feedback recorded: ${feedback} for movie ${movieId}`);
    } catch (error) {
      console.error("Error recording feedback:", error.message);
    }
  };

  const handleRefresh = async () => {
    await fetchPersonalizedRecommendations();
  };

  const handleRetry = () => {
    if (chatQuery.trim()) {
      setRetryCount(0);
      fetchChatRecommendations();
    } else {
      setError("Please enter a query to retry");
    }
  };

  const handleMovieClick = (movieId) => {
    if (movieId) navigate(`/movie/${movieId}`);
  };

  const getPosterUrl = (poster_path) => {
    if (!poster_path || poster_path === "N/A") {
      return "https://dummyimage.com/500x750/ccc/fff.png&text=No+Poster";
    }
    if (poster_path.startsWith("http")) return poster_path;
    return `https://image.tmdb.org/t/p/w500${poster_path}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp?.toDate) return "Just now";
    return timestamp
      .toDate()
      .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const suggestedQueries = [
    "90s action movies",
    "World War II dramas",
    "Sci-fi thrillers",
    "Romantic comedies",
    "Movies by Adrien Brody",
  ];

  return (
    <div className="recommendation-page">
      <div className="recommendation-container">
        <div className="header-container">
          <button
            className="back-to-home-btn"
            onClick={() => navigate("/")}
            title="Back to Home"
          >
            <span className="arrow-icon">←</span>
            Back to Home
          </button>
          <div className="title-wrapper">
            <h1>MovieAI Recommendations</h1>
          </div>
        </div>

        <div className="tabs">
          <button
            className={activeTab === "personalized" ? "active" : ""}
            onClick={() => {
              setActiveTab("personalized");
              setError(null);
            }}
          >
            Personalized
          </button>
          <button
            className={activeTab === "chat" ? "active" : ""}
            onClick={() => {
              setActiveTab("chat");
              setError(null);
            }}
          >
            Chat Model
          </button>
        </div>

        {activeTab === "personalized" && (
          <div className="personalized-container">
            <div className="header">
              <h2>Your Personalized Picks (15 Movies)</h2>
              <FiRefreshCw
                className={`refresh-icon ${loading ? "spinning" : ""}`}
                onClick={handleRefresh}
                title="Refresh Recommendations"
              />
            </div>
            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <span>
                  Fetching your recommendations... (may take up to 30 seconds)
                </span>
              </div>
            )}
            {error && <div className="error-message">{error}</div>}
            {!loading && personalizedRecommendations.length > 0 && (
              <div className="recommendations-grid personalized">
                {personalizedRecommendations.map((movie) => (
                  <div
                    key={movie.id || movie.tmdb_id}
                    className="movie-card"
                    onClick={() => handleMovieClick(movie.id || movie.tmdb_id)}
                  >
                    <div className="movie-poster">
                      {movie.poster_path ? (
                        <img
                          src={getPosterUrl(movie.poster_path)}
                          alt={movie.title}
                          onError={(e) => {
                            console.error(
                              `Failed to load poster for ${movie.title}`
                            );
                            e.target.src =
                              "https://dummyimage.com/500x750/ccc/fff.png&text=No+Poster";
                          }}
                        />
                      ) : (
                        <div className="no-poster">No Poster</div>
                      )}
                      <div className="movie-overlay">
                        <div className="movie-meta">
                          <span className="rating">
                            ★ {movie.vote_average?.toFixed(1) || "N/A"}
                          </span>
                          <span className="genres">
                            {movie.genres?.join(", ") || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="movie-info">
                      <h3>{movie.title}</h3>
                      <span className="year">
                        {movie.release_date?.substring(0, 4) ||
                          movie.year ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && personalizedRecommendations.length === 0 && !error && (
              <div className="empty-state">
                No recommendations yet. Click the refresh icon to get started!
              </div>
            )}
            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="chat-container">
              <h2>Chat with MovieAI</h2>
              {error && (
                <div className="error-message">
                  <span>{error}</span>
                  {error.includes("timeout") && (
                    <button onClick={handleRetry} disabled={loading}>
                      <FiRotateCcw /> Retry
                    </button>
                  )}
                </div>
              )}
              <div ref={chatContainerRef} className="chat-history">
                {chatHistory.length === 0 && (
                  <p className="placeholder">
                    No chat history yet. Start by entering a query!
                  </p>
                )}
                {chatHistory.map((chat) => (
                  <div key={chat.id} className="mb-4">
                    <div className="message-user">
                      <div className="bg-blue-500 user-avatar">U</div>
                      <div className="user-message-bubble">
                        <p className="font-semibold">{chat.user}</p>
                        <p className="text-xs">
                          {formatTimestamp(chat.timestamp)}
                        </p>
                      </div>
                    </div>
                    {chat.bot && (
                      <div className="message-bot">
                        <div className="bg-gray-800 bot-avatar">AI</div>
                        <div className="bot-message-bubble">
                          <p>
                            {chat.text_response ||
                              "Here are your movie recommendations!"}
                          </p>
                          <p className="text-xs">
                            {formatTimestamp(chat.timestamp)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="message-bot loading-chat-message">
                    <div className="bg-gray-800 bot-avatar">AI</div>
                    <div className="bot-message-bubble">
                      <div className="spinner small-spinner"></div>
                      <span>Typing...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="input-container">
                <input
                  type="text"
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  placeholder="e.g., Suggest sci-fi thrillers or Movies by Ryan Gosling"
                  disabled={loading}
                  onKeyPress={(e) =>
                    e.key === "Enter" && fetchChatRecommendations()
                  }
                />
                <button
                  className="send-button"
                  onClick={fetchChatRecommendations}
                  disabled={loading}
                >
                  <FiSend /> Send
                </button>
              </div>
              <div className="query-suggestions">
                <p>Suggested queries:</p>
                <div className="suggestions-list">
                  {suggestedQueries.map((query, index) => (
                    <button
                      key={`suggestion-${query}-${index}`}
                      className="suggestion-btn"
                      onClick={() => setChatQuery(query)}
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="recommendations-container">
              <h2>Recommended Movies (5 Movies)</h2>
              <div className="chatbot-response-text">{chatBotResponseText}</div>
              {!loading && chatRecommendations.length > 0 ? (
                <div className="recommendations-grid chat">
                  {chatRecommendations.map((movie) => (
                    <div
                      key={movie.tmdb_id || movie.title}
                      className="movie-card"
                      onClick={() =>
                        handleMovieClick(movie.tmdb_id || movie.id)
                      }
                    >
                      <div className="movie-poster">
                        {movie.poster_path ? (
                          <img
                            src={getPosterUrl(movie.poster_path)}
                            alt={movie.title}
                            onError={(e) => {
                              console.error(
                                `Failed to load poster for ${movie.title}`
                              );
                              e.target.src =
                                "https://dummyimage.com/500x750/ccc/fff.png&text=No+Poster";
                            }}
                          />
                        ) : (
                          <div className="no-poster">No Poster</div>
                        )}
                        <div className="rating-badge">
                          ★ {movie.vote_average?.toFixed(1) || "N/A"}
                        </div>
                      </div>
                      <div className="movie-info">
                        <h3>{movie.title}</h3>
                        <p className="year">{movie.year || "N/A"}</p>
                        <p className="text-sm description">
                          {movie.description || "No description available."}
                        </p>
                        <p className="text-blue-600 justification">
                          <strong>Why:</strong>{" "}
                          {movie.justification || "Matches your query."}
                        </p>
                        <div className="feedback-buttons">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFeedback(
                                movie.tmdb_id || movie.id,
                                "thumbs_up"
                              );
                            }}
                          >
                            <FiThumbsUp />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFeedback(
                                movie.tmdb_id || movie.id,
                                "thumbs_down"
                              );
                            }}
                          >
                            <FiThumbsDown />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  {loading
                    ? "Fetching recommendations..."
                    : error
                    ? "No results found for your query. Try a suggested query or rephrase your request."
                    : "Enter a query in the chat to see recommended movies!"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendPage;
