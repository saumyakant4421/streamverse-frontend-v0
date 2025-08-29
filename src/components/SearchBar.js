import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { movieService } from "../lib/services";
import "../styles/searchbar.scss";

const SearchBar = ({ placeholder = "Search movies..." }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const navigate = useNavigate();

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
        const response = await movieService.get("/search", {
          params: { query: searchQuery },
          signal: abortController.signal,
        });
        setSearchResults(response.data || []);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log("Previous search request canceled");
        } else {
          console.error("Error searching movies:", error);
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
  }, [searchQuery]);

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
        onClick={() => navigate(`/movie/${movie.id}`)}
      >
        <div className="search-result-poster">
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
              alt={movie.title}
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
                navigate(`/movie/${movie.id}`);
              }}
            >
              Details
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
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={handleSearchFocus}
        onBlur={handleSearchBlur}
        className="search-input"
      />
      <div className="search-bar-icons">
        <FaSearch className="search-icon" />
        {searchQuery && (
          <button className="clear-search-btn" onClick={handleCloseSearch}>
            ×
          </button>
        )}
      </div>
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

export default SearchBar;
