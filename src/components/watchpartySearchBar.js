// src/components/WatchPartySearchBar.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import '../styles/searchbar.scss';

const WatchPartySearchBar = ({
  apiBaseUrl = 'http://localhost:4004/api/tools/watchparty',
  placeholder = 'Search movies for your watch party...',
  onMovieSelect,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Create Axios instance with authentication
  const watchPartyService = axios.create({
    baseURL: apiBaseUrl,
  });

  watchPartyService.interceptors.request.use(
    async (config) => {
      if (user && user.getIdToken) {
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Debounced search for movies
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setIsSearchLoading(true);
    setShowSearchResults(true);

    const source = axios.CancelToken.source();

    const searchMovies = async () => {
      try {
        const response = await watchPartyService.get('/search', {
          params: { query: searchQuery },
          cancelToken: source.token,
        });
        setSearchResults(response.data || []);
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Previous search request canceled');
        } else {
          console.error('Error searching movies:', error.message, error.response?.data);
          const errorMessage =
            error.response?.status === 401
              ? 'Please log in to search movies'
              : error.response?.status === 404
              ? 'Movie search endpoint not found. Please contact support.'
              : error.response?.data?.error || 'Failed to search movies';
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
      source.cancel();
    };
  }, [searchQuery, apiBaseUrl, user]);

  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowSearchResults(false);
    }, 200);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim() !== '') {
      setShowSearchResults(true);
    }
  };

  const handleCloseSearch = () => {
    setSearchQuery('');
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
            setSearchQuery('');
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
                e.target.src = 'https://via.placeholder.com/92x138?text=No+Image';
              }}
            />
          ) : (
            <div className="no-poster">No Image</div>
          )}
        </div>
        <div className="search-result-details">
          <h4>{movie.title}</h4>
          <p>{movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}</p>
          <div className="search-result-actions">
            <button
              className="search-watch-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onMovieSelect) {
                  onMovieSelect(movie);
                  setSearchQuery('');
                  setShowSearchResults(false);
                }
              }}
              disabled={!user}
              title={!user ? 'Please log in to add movies' : ''}
            >
              <FaPlus /> Add
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
      <FaSearch className="search-icon" />
      {searchQuery && (
        <button className="clear-search-btn" onClick={handleCloseSearch}>
          ×
        </button>
      )}
      {isSearchLoading && <div className="loading-spinner">Loading...</div>}
      {showSearchResults && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((movie) => (
            <SearchResultCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
      {showSearchResults && searchQuery && !isSearchLoading && searchResults.length === 0 && (
        <div className="search-results">
          <div className="no-results">No movies found matching "{searchQuery}"</div>
        </div>
      )}
    </div>
  );
};

export default WatchPartySearchBar;