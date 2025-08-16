
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import '../styles/franchise-search.scss';

const FranchiseSearch = () => {
  const [query, setQuery] = useState('');
  const [franchises, setFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setFranchises([]);
      return;
    }
    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await axios.get('http://localhost:4014/api/franchises/search', {
          params: { query },
        });
        setFranchises(response.data);
      } catch (error) {
        console.error('Error searching franchises:', error);
        toast.error('Failed to search franchises. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Define popular franchises (aligned with custom franchise pages)
  const popularFranchises = [
    { name: 'MCU', id: 'mcu', path: '/popularfranchises/mcu' },
    { name: 'DCEU', id: 'dceu', path: '/popularfranchises/dceu' },
    { name: 'DCU', id: 'dcu', path: '/popularfranchises/dcu' },
    { name: 'Star Wars', id: 'starwars', path: '/popularfranchises/starwars' },
    { name: 'Aliens', id: 'aliens', path: '/popularfranchises/aliens' },
    { name: 'Harry Potter', id: 'harrypotter', path: '/popularfranchises/harrypotter' },
    { name: 'Lord of the Rings', id: 'lotr', path: '/popularfranchises/lotr' },
  ];

  return (
    <div className="franchise-search-container">
      <Navbar />
      <div className="background-animation">
        <div className="animated-orb"></div>
        <div className="animated-orb"></div>
        <div className="animated-orb"></div>
      </div>
      <div className="content-wrapper">
        {/* Search Collection Section */}
        <div className="franchise-search">
          <h2>Explore Movie Franchises</h2>
          <input
            type="text"
            placeholder="Search franchises (e.g., Avengers, Harry Potter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            aria-label="Search for movie franchises"
          />
          {isLoading && <div className="loading-spinner">Loading...</div>}
          <div className="franchise-grid">
            {franchises.map((franchise, index) => (
              <Link
                to={`/franchises/${franchise.id}`}
                key={franchise.id}
                className="franchise-card"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {franchise.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w200${franchise.poster_path}`}
                    alt={franchise.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="no-poster">No Image</div>
                )}
                <h3>{franchise.name}</h3>
              </Link>
            ))}
          </div>
          {query && !isLoading && franchises.length === 0 && (
            <p className="no-results">No franchises found for "{query}"</p>
          )}
        </div>

        {/* Popular Franchises Section */}
        <div className="popular-franchises">
          <h2>Popular Franchises</h2>
          <div className="franchise-buttons">
            {popularFranchises.map((franchise) => (
              <Link
                to={franchise.path}
                key={franchise.id}
                className="franchise-button"
              >
                {franchise.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FranchiseSearch;
