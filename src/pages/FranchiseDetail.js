import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { TiChevronRight, TiChevronLeft, TiGroup, TiVideo, TiFilm, TiCreditCard, TiTime } from 'react-icons/ti';
import axios from 'axios';
import Navbar from '../pages/Navbar';
import franchisesData from '../utils/popularFranchises.json';
import mcuPoster from '../assets/franchises/wallpaperflare.com_wallpaper.jpg';
import dceuPoster from '../assets/franchises/wp6618456-dceu-wallpapers.avif';
import swPoster from '../assets/franchises/star-wars.jpg';
import hpPoster from '../assets/franchises/harrypotter.jpg';
import lotrPoster from '../assets/franchises/LOTR.jpg';
import aliensPoster from '../assets/franchises/aliens.jpg';
import dcuPoster from '../assets/franchises/dcu.jpg';
import '../styles/popular-franchise.scss';

// Log the imported Navbar for debugging
// console.log('Imported Navbar:', Navbar);

// Fallback Navbar in case the import fails
const FallbackNavbar = () => <nav style={{ padding: '1rem', background: '#333', color: '#fff' }}>Fallback Navbar</nav>;

// Fallback image
const FALLBACK_POSTER = `${import.meta.env.PUBLIC_URL}/images/fallback-poster.jpg`;

const FranchiseTimeline = ({ movies }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Initialize activeIndex to the center (3rd node) if possible, otherwise the last item
  const itemsPerView = 5;
  const maxIndex = Math.max(0, movies.length - itemsPerView);
  const initialActiveIndex = movies.length >= 3 ? 2 : movies.length - 1; // Center (3rd) if >= 3 movies, else last item
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);

  useEffect(() => {
    // Calculate the center index based on currentIndex
    let newActiveIndex = currentIndex + 2; // Center of the 5 visible items
    // Ensure newActiveIndex is within bounds
    if (newActiveIndex < 0) {
      newActiveIndex = 0;
    } else if (newActiveIndex >= movies.length) {
      newActiveIndex = movies.length - 1;
    }
    setActiveIndex(newActiveIndex);
    // Log for debugging
    console.log('Current Index:', currentIndex, 'Active Index:', newActiveIndex, 'Movies Length:', movies.length);
  }, [currentIndex, movies.length]);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const handleMouseEnter = (index) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    let newActiveIndex = currentIndex + 2;
    if (newActiveIndex < 0) {
      newActiveIndex = 0;
    } else if (newActiveIndex >= movies.length) {
      newActiveIndex = movies.length - 1;
    }
    setActiveIndex(newActiveIndex);
  };

  if (!movies || movies.length === 0) {
    return <p className="fd-no-results">No movies available</p>;
  }

  return (
    <div className="fd-timeline-container">
      <div className="fd-timeline-carousel-wrapper">
        <div
          className="fd-timeline-track"
          style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
        >
          {movies.map((movie, index) => (
            <Link
              key={movie.id || index}
              to={movie.id ? `/movie/${movie.id}` : '#'}
              className={`fd-timeline-item ${index === activeIndex ? 'fd-timeline-item-active' : ''}`}
              style={{ flex: `0 0 ${100 / itemsPerView}%` }}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="fd-timeline-marker"></div>
              <div className="fd-timeline-content">
                <div className="fd-timeline-node">
                  <h3>{movie.title}</h3>
                  <span className="fd-timeline-date">
                    {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBD'}
                  </span>
                </div>
                <div className="fd-timeline-tile">
                  <img
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                        : `https://via.placeholder.com/150x225/1a1a1a/666?text=${encodeURIComponent(movie.title.charAt(0))}`
                    }
                    alt={movie.title}
                    className="fd-timeline-poster"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/150x225/1a1a1a/666?text=${encodeURIComponent(movie.title.charAt(0))}`;
                    }}
                  />
                </div>
              </div>
              {index < movies.length - 1 && <div className="fd-timeline-connector"></div>}
            </Link>
          ))}
        </div>
      </div>
      {maxIndex > 0 && (
        <>
          <button
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="fd-timeline-nav-btn-left"
            aria-label="Previous timeline item"
          >
            <TiChevronLeft />
          </button>
          <button
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex}
            className="fd-timeline-nav-btn-right"
            aria-label="Next timeline item"
          >
            <TiChevronRight />
          </button>
        </>
      )}
    </div>
  );
};

const Carousel = ({ items, title, type }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 6;
  const maxIndex = Math.max(0, items.length - itemsPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const handleImageError = (e) => {
    const person = items.find(item => item.id === e.target.dataset.id);
    const initial = person?.name?.charAt(0) || 'N';
    e.target.src = `https://via.placeholder.com/100x150/1a1a1a/666?text=${encodeURIComponent(initial)}`;
    console.warn(`Failed to load person image for ${person?.name || 'Unknown'}: ${e.target.src}`);
  };

  if (!items || items.length === 0) {
    return (
      <div className="fd-carousel-container">
        <h2 className="fd-section-title">
          {type === 'cast' ? <TiGroup /> : <TiVideo />}
          {title}
        </h2>
        <p>No {type} information available</p>
      </div>
    );
  }

  return (
    <div className="fd-carousel-container">
      <div className="fd-carousel-header">
        <h2 className="fd-section-title">
          {type === 'cast' ? <TiGroup /> : <TiVideo />}
          {title}
        </h2>
        <div className="fd-carousel-controls">
          <button
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="fd-carousel-btn"
            aria-label="Previous slide"
          >
            <TiChevronLeft />
          </button>
          <button
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex}
            className="fd-carousel-btn"
            aria-label="Next slide"
          >
            <TiChevronRight />
          </button>
        </div>
      </div>
      <div className="fd-carousel-wrapper">
        <div
          className="fd-carousel-track"
          style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
        >
          {items.map((item, index) => (
            <div key={item.id || index} className="fd-carousel-item">
              <div className="fd-person-card">
                <img
                  src={
                    item.profile_path
                      ? `https://image.tmdb.org/t/p/w185${item.profile_path}`
                      : `https://via.placeholder.com/100x150/1a1a1a/666?text=${encodeURIComponent(item.name?.charAt(0) || 'N')}`
                  }
                  alt={item.name || 'Unknown'}
                  className="fd-person-image"
                  loading="lazy"
                  data-id={item.id}
                  onError={handleImageError}
                />
                <span className="fd-person-name">{item.name || 'Unknown'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FranchiseDetail = () => {
  const { collectionId } = useParams();
  const [franchise, setFranchise] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  const franchisePosters = {
    mcu: mcuPoster,
    dceu: dceuPoster,
    starwars: swPoster,
    harrypotter: hpPoster,
    lotr: lotrPoster,
    aliens: aliensPoster,
    dcu: dcuPoster,
  };

  const tmdbCollectionIds = {
    mcu: '373558',
    dceu: '507086',
    star_wars: '10',
    harry_potter: '1241',
    lotr: '119',
    aliens: '8091',
    dcu: null,
  };

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'YOUR_TMDB_API_KEY';
  const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

  useEffect(() => {
    const fetchFranchiseData = async () => {
      setIsLoading(true);
      setError(null);
      setImageError(false);

      try {
        const jsonFranchise = franchisesData.franchises.find(f => f.id === (collectionId || 'mcu'));
        if (!jsonFranchise) {
          throw new Error(`Franchise not found for ID: ${collectionId}`);
        }

        let franchiseData = {
          id: jsonFranchise.id,
          name: jsonFranchise.name,
          overview: jsonFranchise.overview || 'No overview available',
          totalBoxOffice: 0,
          poster_path: franchisePosters[jsonFranchise.id] || null,
          movies: [],
        };

        const tmdbId = tmdbCollectionIds[jsonFranchise.id] || collectionId;
        if (tmdbId) {
          try {
            const collectionResponse = await axios.get(
              `${TMDB_BASE_URL}/collection/${tmdbId}?api_key=${TMDB_API_KEY}`
            );
            if (!franchiseData.overview || franchiseData.overview === 'No overview available') {
              franchiseData.overview = collectionResponse.data.overview || 'No overview available';
            }
            if (!franchiseData.poster_path) {
              franchiseData.poster_path = collectionResponse.data.backdrop_path
                ? `https://image.tmdb.org/t/p/w1280${collectionResponse.data.backdrop_path}`
                : null;
            }
          } catch (collectionError) {
            console.warn(`Failed to fetch collection details for ${collectionId}:`, collectionError);
          }
        }

        const moviePromises = jsonFranchise.movies.map(async (movie) => {
          if (!movie.id) {
            return {
              id: `temp-${movie.title.replace(/\s+/g, '-')}`,
              title: movie.title,
              release_date: 'N/A',
              overview: 'No overview available',
              poster_path: null,
              cast: [],
              directors: [],
              box_office: 0,
            };
          }

          try {
            const movieResponse = await axios.get(
              `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`
            );
            const movieData = movieResponse.data;
            return {
              id: movie.id,
              title: movie.title,
              release_date: movieData.release_date || 'N/A',
              overview: movieData.overview || 'No overview available',
              poster_path: movieData.poster_path || null,
              cast: movieData.credits?.cast
                ?.slice(0, 5)
                .map(person => ({
                  id: person.id,
                  name: person.name,
                  profile_path: person.profile_path || null,
                })) || [],
              directors: movieData.credits?.crew
                ?.filter(person => person.job === 'Director')
                .map(person => ({
                  id: person.id,
                  name: person.name,
                  profile_path: person.profile_path || null,
                })) || [],
              box_office: movieData.revenue || 0,
            };
          } catch (movieError) {
            console.warn(`Failed to fetch details for movie ${movie.title}:`, movieError);
            return {
              id: movie.id,
              title: movie.title,
              release_date: 'N/A',
              overview: 'No overview available',
              poster_path: null,
              cast: [],
              directors: [],
              box_office: 0,
            };
          }
        });

        const movies = await Promise.all(moviePromises);

        franchiseData.movies = movies.sort((a, b) => {
          const dateA = a.release_date !== 'N/A' ? new Date(a.release_date) : new Date(9999, 0, 1);
          const dateB = b.release_date !== 'N/A' ? new Date(b.release_date) : new Date(9999, 0, 1);
          return dateA - dateB;
        });

        franchiseData.totalBoxOffice = movies.reduce((sum, movie) => sum + movie.box_office, 0);

        setFranchise(franchiseData);
      } catch (error) {
        console.error('Error fetching franchise:', error);
        setError('Failed to load franchise. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFranchiseData();
  }, [collectionId, TMDB_API_KEY]);

  const totalCast = useMemo(() => {
    if (!franchise?.movies) return [];
    return Array.from(
      new Map(
        franchise.movies
          .flatMap(movie => movie.cast || [])
          .map(person => [
            person.id,
            {
              id: person.id,
              name: person.name || 'Unknown',
              profile_path: person.profile_path || null,
            },
          ])
      ).values()
    );
  }, [franchise]);

  const totalDirectors = useMemo(() => {
    if (!franchise?.movies) return [];
    return Array.from(
      new Map(
        franchise.movies
          .flatMap(movie => movie.directors || [])
          .map(person => [
            person.id,
            {
              id: person.id,
              name: person.name || 'Unknown',
              profile_path: person.profile_path || null,
            },
          ])
      ).values()
    );
  }, [franchise]);

  const handleImageError = (e) => {
    if (!imageError) {
      console.warn(`Poster image failed to load: ${e.target.src}`);
      setImageError(true);
      e.target.src = FALLBACK_POSTER;
    }
  };

  const RenderNavbar = Navbar || FallbackNavbar;

  if (isLoading) {
    return (
      <div className="fd-franchise-detail-container">
        <div className="fd-navbar">
          <RenderNavbar />
        </div>
        <div className="fd-content-wrapper">
          <div className="fd-loading-spinner">
            <div className="fd-spinner"></div>
            <p>Loading franchise details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fd-franchise-detail-container">
        <div className="fd-navbar">
          <RenderNavbar />
        </div>
        <div className="fd-content-wrapper">
          <p className="fd-no-results">{error}</p>
          <button className="fd-back-link" onClick={() => window.history.back()}>
            Back to Popular Franchises
          </button>
        </div>
      </div>
    );
  }

  if (!franchise) {
    return (
      <div className="fd-franchise-detail-container">
        <div className="fd-navbar">
          <RenderNavbar />
        </div>
        <div className="fd-content-wrapper">
          <p className="fd-no-results">Franchise not found for ID: {collectionId}</p>
          <button className="fd-back-link" onClick={() => window.history.back()}>
            Back to Popular Franchises
          </button>
        </div>
      </div>
    );
  }

  const backdropImage = imageError || !franchise.poster_path ? FALLBACK_POSTER : franchise.poster_path;

  return (
    <div className="fd-franchise-detail-container">
      <div className="fd-navbar">
        <RenderNavbar />
      </div>
      {franchise.poster_path && (
        <img
          src={franchise.poster_path}
          alt=""
          style={{ display: 'none' }}
          onError={handleImageError}
        />
      )}
      <div className="fd-background-animation">
        <div className="fd-animated-orb"></div>
        <div className="fd-animated-orb"></div>
        <div className="fd-animated-orb"></div>
      </div>

      <header className="fd-franchise-header">
        <div className="fd-backdrop-poster">
          <div
            className="fd-backdrop-poster-image"
            style={{ backgroundImage: `url(${backdropImage})` }}
          >
            <div className="fd-backdrop-overlay"></div>
            <div className="fd-header-content">
              <h1 className="fd-backdrop-title">{franchise.name || 'Unknown Franchise'}</h1>
              <div className="fd-franchise-stats">
                <div className="fd-stat-item">
                  <TiFilm />
                  <span>{franchise.movies.length} Movies</span>
                </div>
                <div className="fd-stat-item">
                  <RiMoneyDollarCircleFill />
                  <span>
                    {franchise.totalBoxOffice > 0
                      ? `$${(franchise.totalBoxOffice / 1000000000).toFixed(1)}B`
                      : 'Not available'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="fd-content-wrapper">
        <section className="fd-franchise-overview-section">
          <p className="fd-franchise-overview">{franchise.overview}</p>
        </section>

        <section className="fd-franchise-details fd-timeline-section">
          <h2 className="fd-section-title">
            <TiTime />
            Timeline
          </h2>
          <FranchiseTimeline movies={franchise.movies} />
        </section>

        <section className="fd-franchise-details fd-cast-section">
          <Carousel items={totalCast} title="Cast" type="cast" />
        </section>

        <section className="fd-franchise-details fd-directors-section">
          <Carousel items={totalDirectors} title="Directors" type="directors" />
        </section>

        <section className="fd-franchise-details fd-movies-section">
          <h2 className="fd-section-title">
            <TiVideo />
            All Movies
          </h2>
          <div className="fd-movies-grid">
            {franchise.movies.map((movie, index) => (
              <Link
                key={movie.id || index}
                to={movie.id ? `/movie/${movie.id}` : '#'}
                className="fd-movie-card"
                style={{
                  '--bg-image': `url(${
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                      : `https://via.placeholder.com/200x300/1a1a1a/666?text=${encodeURIComponent(movie.title.charAt(0))}`
                  })`,
                }}
              >
                <div className="fd-movie-backdrop">
                  <div className="fd-movie-overlay"></div>
                  <div className="fd-movie-info">
                    <h3 className="fd-movie-title">{movie.title || 'Unknown Movie'}</h3>
                    <span className="fd-movie-year">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBD'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default FranchiseDetail;