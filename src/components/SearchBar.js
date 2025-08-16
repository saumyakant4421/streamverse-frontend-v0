import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSearch } from 'react-icons/fa';
import '../styles/searchbar.scss';

const SearchBar = ({ apiBaseUrl = 'http://localhost:4001/api', placeholder = 'Search movies...' }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

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
        const response = await axios.get(`${apiBaseUrl}/movies/search`, {
          params: { query: searchQuery },
          cancelToken: source.token,
        });
        setSearchResults(response.data || []);
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Previous search request canceled');
        } else {
          console.error('Error searching movies:', error);
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
  }, [searchQuery, apiBaseUrl]);

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
          <p>{movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}</p>
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
      <FaSearch className="search-icon" />
      {searchQuery && (
        <button 
          className="clear-search-btn"
          onClick={handleCloseSearch}
        >
          ×
        </button>
      )}
      {isSearchLoading && <div className="loading-spinner">Loading...</div>}
      {showSearchResults && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map(movie => (
            <SearchResultCard 
              key={movie.id} 
              movie={movie}
            />
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

export default SearchBar;