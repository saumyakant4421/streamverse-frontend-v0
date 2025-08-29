import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { marathonService } from "../lib/services";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import "../styles/searchbar.scss";

const MarathonSearch = ({ onAddToBucket, bucket = [] }) => {
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
      console.log("Searching with query:", searchQuery);
      try {
        const response = await marathonService.get("/search", {
          params: { query: searchQuery },
          signal: abortController.signal,
        });
        console.log("Search response:", response.data);
        setSearchResults(response.data || []);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log("Previous search request canceled");
        } else {
          console.error("Error searching movies:", error);
          toast.error(error.response?.data?.error || "Failed to search movies");
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
    const isInBucket = bucket.some((m) => m.id === movie.id);
    const isBucketFull = bucket.length >= 30;

    return (
      <div className="search-result-item">
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
                onAddToBucket(movie);
              }}
              disabled={isInBucket || isBucketFull || !user}
              title={
                !user
                  ? "Please log in to add movies"
                  : isInBucket
                  ? "Movie already in bucket"
                  : isBucketFull
                  ? "Bucket limit reached (30 movies)"
                  : ""
              }
            >
              {isInBucket ? "Added" : "Add to Bucket"}
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
        placeholder="Search movies to add to marathon..."
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

export default MarathonSearch;
