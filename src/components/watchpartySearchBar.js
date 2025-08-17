import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { watchPartyService } from "../lib/services";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import "../styles/searchbar.scss";

const WatchPartySearchBar = ({ onMovieSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setIsSearchLoading(true);
    setShowSearchResults(true);

    const abortController = new AbortController();

    const searchMovies = async () => {
      try {
        const response = await watchPartyService.get("/search", {
          params: { query: searchQuery },
          signal: abortController.signal,
        });
        setSearchResults(response.data || []);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log("Previous search request canceled");
        } else {
          console.error(
            "Error searching movies:",
            error.message,
            error.response?.data
          );
          const errorMessage =
            error.response?.status === 401
              ? "Please log in to search movies"
              : error.response?.status === 404
              ? "Movie search endpoint not found. Please contact support."
              : error.response?.data?.error || "Failed to search movies";
          toast.error(errorMessage);
          setSearchResults([]);
        }
      } finally {
        setIsSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(searchMovies, 500);
    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [searchQuery, user]);

  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowSearchResults(false);
    }, 200);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim() !== "") {
      setShowSearchResults(true);
    }
  };

  const handleCloseSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const SearchResultCard = ({ movie }) => {
    return (
      <div
        className="search-result-item"
        onClick={() => {
          if (onMovieSelect) {
            onMovieSelect(movie);
            setSearchQuery("");
            setShowSearchResults(false);
          }
        }}
      >
        <div className="search-result-poster">
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
              alt={movie.title}
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/92x138?text=No+Image";
              }}
            />
          ) : (
            <div className="no-poster">No Image</div>
          )}
        </div>
        <div className="search-result-details">
          <h4>{movie.title}</h4>
          <p>
            {movie.release_date
              ? new Date(movie.release_date).getFullYear()
              : "Unknown"}
          </p>
          <div className="search-result-actions">
            <button
              className="search-watch-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onMovieSelect) {
                  onMovieSelect(movie);
                  setSearchQuery("");
                  setShowSearchResults(false);
                }
              }}
            >
              Select Movie
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search movies for watch party..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={handleSearchFocus}
        onBlur={handleSearchBlur}
        className="search-input"
      />
      <FaSearch className="search-icon" />
      {searchQuery && (
        <button className="clear-search" onClick={handleCloseSearch}>
          ×
        </button>
      )}
      {showSearchResults && (
        <div className="search-results">
          {isSearchLoading ? (
            <div className="search-loading">Searching...</div>
          ) : searchResults.length > 0 ? (
            searchResults.slice(0, 5).map((movie) => (
              <SearchResultCard key={movie.id} movie={movie} />
            ))
          ) : searchQuery.trim().length >= 2 ? (
            <div className="no-results">No movies found</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default WatchPartySearchBar;
