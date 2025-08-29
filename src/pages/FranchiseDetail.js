import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import {
  TiChevronRight,
  TiChevronLeft,
  TiGroup,
  TiVideo,
  TiFilm,
  TiTime,
} from "react-icons/ti";
import { franchiseService } from "../lib/services";
import Navbar from "./Navbar";
import franchisesData from "../utils/popularFranchises.json";
import "../styles/popular-franchise.scss";

// Fallback Navbar
const FallbackNavbar = () => (
  <nav style={{ padding: "1rem", background: "#333", color: "#fff" }}>
    Fallback Navbar
  </nav>
);

// Fallback image (use an existing public asset)
const FALLBACK_POSTER = "/franchises/wallpaperflare.com_wallpaper.jpg";

const FranchiseTimeline = ({ movies }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 5;
  const maxIndex = Math.max(0, movies.length - itemsPerView);
  const initialActiveIndex = movies.length >= 3 ? 2 : movies.length - 1;
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);

  useEffect(() => {
    let newActiveIndex = currentIndex + 2;
    if (newActiveIndex < 0) {
      newActiveIndex = 0;
    } else if (newActiveIndex >= movies.length) {
      newActiveIndex = movies.length - 1;
    }
    setActiveIndex(newActiveIndex);
    console.log(
      "Current Index:",
      currentIndex,
      "Active Index:",
      newActiveIndex,
      "Movies Length:",
      movies.length
    );
  }, [currentIndex, movies.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
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
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
          }}
        >
          {movies.map((movie, index) => (
            <Link
              key={movie.id || index}
              to={movie.id ? `/movie/${movie.id}` : "#"}
              className={`fd-timeline-item ${
                index === activeIndex ? "fd-timeline-item-active" : ""
              }`}
              style={{ flex: `0 0 ${100 / itemsPerView}%` }}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="fd-timeline-marker"></div>
              <div className="fd-timeline-content">
                <div className="fd-timeline-node">
                  <h3>{movie.title}</h3>
                  <span className="fd-timeline-date">
                    {movie.release_date
                      ? new Date(movie.release_date).getFullYear()
                      : "TBD"}
                  </span>
                </div>
                <div className="fd-timeline-tile">
                  <img
                    src={
                      movie.poster_path
                        ? movie.poster_path.startsWith("http")
                          ? movie.poster_path
                          : movie.poster_path.startsWith("/assets/")
                            ? movie.poster_path
                            : `https://image.tmdb.org/t/p/w200${movie.poster_path}`
: "/franchises/wallpaperflare.com_wallpaper.jpg"
                    }
                    alt={movie.title}
                    className="fd-timeline-poster"
                    loading="lazy"
                    onError={(e) => {
e.target.src = "/franchises/wallpaperflare.com_wallpaper.jpg";
                    }}
                  />
                </div>
              </div>
              {index < movies.length - 1 && (
                <div className="fd-timeline-connector"></div>
              )}
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
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleImageError = (e) => {
    const person = items.find((item) => item.id === e.target.dataset.id);
    const initial = person?.name?.charAt(0) || "N";
    e.target.src = `${import.meta.env.PUBLIC_URL || ""}/images/placeholder.jpg`;
    console.warn(
      `Failed to load person image for ${person?.name || "Unknown"}: ${
        e.target.src
      }`
    );
  };

  if (!items || items.length === 0) {
    return (
      <div className="fd-carousel-container">
        <h2 className="fd-section-title">
          {type === "cast" ? <TiGroup /> : <TiVideo />}
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
          {type === "cast" ? <TiGroup /> : <TiVideo />}
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
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
          }}
        >
          {items.map((item, index) => (
            <div key={item.id || index} className="fd-carousel-item">
              <div className="fd-person-card">
                <img
                  src={
                    item.profile_path
                      ? `https://image.tmdb.org/t/p/w185${item.profile_path}`
                      : `${
                          import.meta.env.PUBLIC_URL || ""
                        }/images/placeholder.jpg`
                  }
                  alt={item.name || "Unknown"}
                  className="fd-person-image"
                  loading="lazy"
                  data-id={item.id}
                  onError={handleImageError}
                />
                <span className="fd-person-name">{item.name || "Unknown"}</span>
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

  useEffect(() => {
    const fetchFranchiseData = async () => {
      setIsLoading(true);
      setError(null);
      setImageError(false);

      try {
        const response = await franchiseService.get(`/${collectionId}`);
        const jsonFranchise = response.data;
        if (!jsonFranchise) {
          throw new Error(`Franchise not found for ID: ${collectionId}`);
        }

        setFranchise(jsonFranchise);
      } catch (error) {
        console.error("Error fetching franchise:", error);
        setError("Failed to load franchise. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFranchiseData();
  }, [collectionId]);

  const totalCast = useMemo(() => {
    if (!franchise?.movies) return [];
    return Array.from(
      new Map(
        franchise.movies
          .flatMap((movie) => movie.cast || [])
          .map((person) => [
            person.id,
            {
              id: person.id,
              name: person.name || "Unknown",
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
          .flatMap((movie) => movie.directors || [])
          .map((person) => [
            person.id,
            {
              id: person.id,
              name: person.name || "Unknown",
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
          <button
            className="fd-back-link"
            onClick={() => window.history.back()}
          >
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
          <p className="fd-no-results">
            Franchise not found for ID: {collectionId}
          </p>
          <button
            className="fd-back-link"
            onClick={() => window.history.back()}
          >
            Back to Popular Franchises
          </button>
        </div>
      </div>
    );
  }



// Use backdrop_poster for the background image, preferring local mapping for curated franchises
const localFranchise = franchisesData?.franchises?.find((f) => f.id === collectionId);
let backdropPath = franchise.backdrop_poster;
// Prefer the local JSON backdrop if available
const localBackdrop = localFranchise?.backdrop_poster;
const backdropImage = (localBackdrop || backdropPath) ? (localBackdrop || backdropPath) : FALLBACK_POSTER;

  return (
    <div className="fd-franchise-detail-container">
      <div className="fd-navbar">
        <RenderNavbar />
      </div>
      {franchise.poster_path && (
        <img
          src={franchise.poster_path}
          alt=""
          style={{ display: "none" }}
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
              <h1 className="fd-backdrop-title">
                {franchise.name || "Unknown Franchise"}
              </h1>
              <div className="fd-franchise-stats">
                <div className="fd-stat-item">
                  <TiFilm />
                  <span>{franchise.movies.length} Movies</span>
                </div>
                <div className="fd-stat-item">
                  <RiMoneyDollarCircleFill />
                  <span>
                    {franchise.totalBoxOffice > 0
                      ? `$${(franchise.totalBoxOffice / 1000000000).toFixed(
                          1
                        )}B`
                      : "Not available"}
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
                to={movie.id ? `/movie/${movie.id}` : "#"}
                className="fd-movie-card"
                style={{
                  "--bg-image": `url(${
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                      : `${
                          import.meta.env.PUBLIC_URL || ""
                        }/images/placeholder.jpg`
                  })`,
                }}
              >
                <div className="fd-movie-backdrop">
                  <div className="fd-movie-overlay"></div>
                  <div className="fd-movie-info">
                    <h3 className="fd-movie-title">
                      {movie.title || "Unknown Movie"}
                    </h3>
                    <span className="fd-movie-year">
                      {movie.release_date
                        ? new Date(movie.release_date).getFullYear()
                        : "TBD"}
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
