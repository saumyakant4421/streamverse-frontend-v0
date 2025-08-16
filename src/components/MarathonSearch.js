
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import '../styles/searchbar.scss';

const MarathonSearchBar = ({
  apiBaseUrl = 'http://localhost:4004/api/tools/marathon',
  placeholder = 'Search movies for your marathon...',
  onAddToBucket,
  bucket = [],
  user,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const marathonService = axios.create({
    baseURL: apiBaseUrl,
  });

  marathonService.interceptors.request.use(
    async (config) => {
      if (user && user.getIdToken) {
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

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
      console.log('Searching with query:', searchQuery);
      try {
        const response = await marathonService.get('/search', {
          params: { query: searchQuery },
          cancelToken: source.token,
        });
        console.log('Search response:', response.data);
        setSearchResults(response.data || []);
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Previous search request canceled');
        } else {
          console.error('Error searching movies:', error);
          toast.error(error.response?.data?.error || 'Failed to search movies');
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
  }, [searchQuery]);

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
          <p>{movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}</p>
          <div className="search-result-actions">
            <button
              className="search-watch-btn" // Changed from search-add-btn to search-watch-btn
              onClick={(e) => {
                e.stopPropagation();
                onAddToBucket(movie);
              }}
              disabled={isInBucket || isBucketFull || !user}
              title={
                !user
                  ? 'Please log in to add movies'
                  : isInBucket
                  ? 'Movie already in bucket'
                  : isBucketFull
                  ? 'Bucket limit reached (30 movies)'
                  : ''
              }
            >
              {isInBucket ? 'Added' : 'Add to Bucket'}
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

export default MarathonSearchBar;
