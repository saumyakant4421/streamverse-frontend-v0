
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import FranchiseTimeline from './FranchiseTimeline';
import Navbar from '../pages//Navbar'; // Fixed path from '../pages/Navbar' to './Navbar'
import '../styles/franchise-page.scss';

const FranchisePage = () => {
  const { collectionId } = useParams();
  const [franchise, setFranchise] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFranchise = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:4014/api/franchises/${collectionId}`);
        console.log('Raw API Response:', JSON.stringify(response.data, null, 2));
        console.log('totalCast:', response.data.totalCast);
        console.log('totalDirectors:', response.data.totalDirectors);
        setFranchise(response.data);
      } catch (error) {
        console.error('Error fetching franchise:', error);
        setError(error.response?.data?.details || 'Failed to load franchise. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFranchise();
  }, [collectionId]);

  useEffect(() => {
    if (franchise) {
      console.log('Processed totalCast:', JSON.stringify(franchise.totalCast, null, 2));
      console.log('Processed totalDirectors:', JSON.stringify(franchise.totalDirectors, null, 2));
      console.log('Cast with profile paths:', 
        franchise.totalCast?.filter(p => p?.profile_path)?.length || 0, 
        'out of', franchise.totalCast?.length || 0);
      console.log('Directors with profile paths:', 
        franchise.totalDirectors?.filter(p => p?.profile_path)?.length || 0, 
        'out of', franchise.totalDirectors?.length || 0);
    }
  }, [franchise]);

  const handleImageError = (e) => {
    const placeholderPath = `${process.env.PUBLIC_URL}/images/placeholder.jpg`;
    const fullPlaceholderUrl = `${window.location.origin}${placeholderPath}`;
    console.log('Placeholder image path:', placeholderPath);
    console.log('Full placeholder URL:', fullPlaceholderUrl);
    if (e.target.src !== fullPlaceholderUrl) {
      console.warn(`Image failed to load: ${e.target.src}`);
      e.target.src = fullPlaceholderUrl;
    }
  };

  if (isLoading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!franchise) return <div className="error-message">Franchise not found</div>;

  // Handle totalCast: Convert strings to objects or use movies.cast
  const totalCast = Array.isArray(franchise.totalCast) && 
    franchise.totalCast.every(p => p && typeof p === 'object' && p.name && p.id)
    ? franchise.totalCast
    : Array.from(
        new Map(
          (franchise.movies || []).flatMap(movie => movie.cast || []).map((person, index) => {
            const name = typeof person === 'string' ? person : person.name;
            const id = typeof person === 'object' && person.id ? person.id : `cast-${index}-${name.replace(/\s+/g, '-')}`;
            const profile_path = typeof person === 'object' ? person.profile_path || null : null;
            return [id, { id, name, profile_path }];
          })
        ).values()
      );

  // Handle totalDirectors: Convert strings to objects or use movies.directors
  const totalDirectors = Array.isArray(franchise.totalDirectors) && 
    franchise.totalDirectors.every(p => p && typeof p === 'object' && p.name && p.id)
    ? franchise.totalDirectors
    : Array.from(
        new Map(
          (franchise.movies || []).flatMap(movie => movie.directors || []).map((person, index) => {
            const name = typeof person === 'string' ? person : person.name;
            const id = typeof person === 'object' && person.id ? person.id : `director-${index}-${name.replace(/\s+/g, '-')}`;
            const profile_path = typeof person === 'object' ? person.profile_path || null : null;
            return [id, { id, name, profile_path }];
          })
        ).values()
      );

  return (
    <div className="franchise-page">
      <div className="gradient-blob"></div> {/* Third gradient blob */}
      <Navbar />
      <div className="franchise-header">
        <div className="franchise-header-content">
          <h1>{franchise.name || 'Unknown Franchise'}</h1>
          <p className="franchise-overview">{franchise.overview || 'No overview available'}</p>
        </div>
        {franchise.poster_path && (
          <img
            src={`https://image.tmdb.org/t/p/w300${franchise.poster_path}`}
            alt={franchise.name || 'Franchise Poster'}
            className="franchise-poster"
            loading="lazy"
            onError={handleImageError}
          />
        )}
      </div>

      <section className="franchise-section">
        <h2>Timeline</h2>
        <FranchiseTimeline movies={franchise.movies || []} />
      </section>

      <section className="franchise-section">
        <h2>Franchise Details</h2>
        <div className="franchise-details">
          <h3>Movies ({franchise.movies?.length || 0})</h3>
          <ul className="movie-list">
            {(franchise.movies || []).map((movie) => (
              <li key={movie.id} className="movie-item">
                {movie.title || 'Unknown Movie'} ({new Date(movie.release_date).getFullYear() || 'N/A'})
              </li>
            ))}
          </ul>

          <h3>Total Cast</h3>
          <div className="person-list">
            {totalCast.length > 0 ? (
              totalCast.map((person) => (
                <div key={person.id} className="person-card" aria-label={`Profile of ${person.name}`}>
                  <img
                    src={
                      person.profile_path && typeof person.profile_path === 'string' && person.profile_path.trim()
                        ? `https://image.tmdb.org/t/p/w92${person.profile_path}`
                        : `${process.env.PUBLIC_URL}/images/placeholder.jpg`
                    }
                    alt={person.name}
                    className="person-image"
                    loading="lazy"
                    onError={handleImageError}
                  />
                  <span className="person-name">{person.name}</span>
                </div>
              ))
            ) : (
              <p>No cast data available</p>
            )}
          </div>

          <h3>All Directors</h3>
          <div className="person-list">
            {totalDirectors.length > 0 ? (
              totalDirectors.map((person) => (
                <div key={person.id} className="person-card" aria-label={`Profile of ${person.name}`}>
                  <img
                    src={
                      person.profile_path && typeof person.profile_path === 'string' && person.profile_path.trim()
                        ? `https://image.tmdb.org/t/p/w92${person.profile_path}`
                        : `${process.env.PUBLIC_URL}/images/placeholder.jpg`
                    }
                    alt={person.name}
                    className="person-image"
                    loading="lazy"
                    onError={handleImageError}
                  />
                  <span className="person-name">{person.name}</span>
                </div>
              ))
            ) : (
              <p>No director data available</p>
            )}
          </div>

          <h3>Total Box Office</h3>
          <p>{franchise.totalBoxOffice > 0 ? `$${franchise.totalBoxOffice.toLocaleString()}` : 'Not available'}</p>
        </div>
      </section>
    </div>
  );
};

export default FranchisePage;
