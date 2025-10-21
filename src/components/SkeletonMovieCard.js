import React from "react";
import "../styles/skeleton-movie-card.scss";

const SkeletonMovieCard = () => {
  return (
    <div className="movie-card skeleton-movie-card">
      <div className="poster-container">
        <div className="skeleton skeleton-poster" />
      </div>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-overview" />
      <div className="skeleton skeleton-actions" />
    </div>
  );
};

export default SkeletonMovieCard;
