import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar.js';
import SearchBar from '../components/SearchBar';
import axios from 'axios';
import '../styles/moviepage.scss';
import { isProviderAvailable, getProviderUrl } from '../utils/streamingProviders';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

import NetflixIcon from '../assets/icons/netflix_2504929.png';
import AmazonIcon from '../assets/icons/icons8-amazon-prime-video.svg';
import DisneyIcon from '../assets/icons/icons8-disney-plus.svg';
import AppleTVIcon from '../assets/icons/icons8-apple-tv.svg';
import ParamountIcon from '../assets/icons/icons8-paramount-plus.svg';
import PeacockIcon from '../assets/icons/download.png';
import HuluIcon from '../assets/icons/icons8-hulu.svg';
import HBOMaxIcon from '../assets/icons/max.svg';

const API_BASE_URL = 'http://localhost:4001/api';

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamingLoading, setStreamingLoading] = useState(false);
  const [streamingError, setStreamingError] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [streamingData, setStreamingData] = useState(null);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchedLoading, setWatchedLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentError, setCommentError] = useState(null);

  console.log('Current user:', user);

  const movieService = axios.create({
    baseURL: API_BASE_URL,
  });

  movieService.interceptors.request.use(
    async (config) => {
      if (user && user.getIdToken) {
        try {
          const token = await user.getIdToken(true);
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.error('Error fetching ID token:', error);
          throw new axios.Cancel('Failed to fetch ID token');
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  const userService = axios.create({
    baseURL: 'http://localhost:5001/api/user',
  });

  userService.interceptors.request.use(
    async (config) => {
      if (user && user.getIdToken) {
        try {
          const token = await user.getIdToken(true);
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.error('Error fetching ID token:', error);
          throw new axios.Cancel('Failed to fetch ID token');
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  const ottProviderMap = {
    netflix: { id: 1, name: 'Netflix', icon: NetflixIcon },
    amazonPrime: { id: 2, name: 'Amazon Prime Video', icon: AmazonIcon },
    disneyPlus: { id: 3, name: 'Disney+ Hotstar', icon: DisneyIcon },
    appleTv: { id: 4, name: 'Apple TV+', icon: AppleTVIcon },
    paramount: { id: 5, name: 'Paramount+', icon: ParamountIcon },
    peacock: { id: 6, name: 'Peacock', icon: PeacockIcon },
    hulu: { id: 7, name: 'Hulu', icon: HuluIcon },
    hboMax: { id: 8, name: 'HBO Max', icon: HBOMaxIcon },
  };

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const movieResponse = await fetch(`${API_BASE_URL}/movies/${id}`);
        if (!movieResponse.ok) throw new Error('Failed to fetch movie details');
        const movieData = await movieResponse.json();
        setMovie(movieData);

        const similarResponse = await fetch(`${API_BASE_URL}/movies/${id}/similar`);
        if (similarResponse.ok) {
          const similarData = await similarResponse.json();
          setSimilarMovies(similarData || []);
        }

        const streamingResponse = await fetch(`${API_BASE_URL}/movies/${id}/streaming?region=US`);
        if (streamingResponse.ok) {
          const streamingData = await streamingResponse.json();
          setStreamingData(streamingData);
        } else {
          setStreamingData(null);
        }

        await fetchComments();

        if (user) await checkWatchlistAndWatchedStatus();
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMovieDetails();
  }, [id, user]);

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      setCommentError(null);
      const response = await movieService.get(`/comments/${id}`);
      console.log('Fetched comments:', response.data);
      setComments(response.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
      setCommentError('Failed to load comments. Please try again.');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to post a comment');
      navigate('/login');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const response = await movieService.post(`/comments/${id}`, { comment: newComment });
      setComments([response.data, ...comments]);
      setNewComment('');
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      const errorMessage = error.response?.status === 401
        ? 'Authentication failed. Please log in again.'
        : error.response?.data?.error || 'Failed to post comment';
      toast.error(errorMessage);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) {
      toast.error('Please log in to delete a comment');
      navigate('/login');
      return;
    }

    try {
      await movieService.delete(`/comments/${commentId}`);
      setComments(comments.filter((comment) => comment.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      const errorMessage = error.response?.status === 401
        ? 'Authentication failed. Please log in again.'
        : error.response?.data?.error || 'Failed to delete comment';
      toast.error(errorMessage);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const checkWatchlistAndWatchedStatus = async () => {
    if (!user) return;

    try {
      const watchlistResponse = await userService.get(`/watchlist`, { params: { uid: user.uid } });
      setIsInWatchlist(watchlistResponse.data.some((item) => item.id === Number(id)));

      const watchedResponse = await userService.get(`/watched`, { params: { uid: user.uid } });
      setIsWatched(watchedResponse.data.some((item) => item.id === Number(id)));
    } catch (error) {
      console.error('Error checking watchlist/watched status:', error.response?.data || error.message);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!user) {
      toast.error('Please log in to add movies to your watchlist');
      navigate('/login');
      return;
    }

    setWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        await userService.delete(`/watchlist/remove`, { params: { uid: user.uid, movieId: movie.id } });
        setIsInWatchlist(false);
        toast.success('Removed from watchlist');
      } else {
        const posterPath = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        await userService.post(`/watchlist/add`, {
          uid: user.uid,
          id: movie.id,
          title: movie.title,
          poster: posterPath,
        });
        setIsInWatchlist(true);
        toast.success('Added to watchlist');
      }
    } catch (error) {
      console.error('Error updating watchlist:', error.response?.data || error.message);
      toast.error(error.response?.data?.error || 'Failed to update watchlist');
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleAddToWatched = async () => {
    if (!user) {
      toast.error('Please log in to mark movies as watched');
      navigate('/login');
      return;
    }

    setWatchedLoading(true);
    try {
      if (isWatched) {
        await userService.delete(`/watched/remove`, { params: { uid: user.uid, movieId: movie.id } });
        setIsWatched(false);
        toast.success('Removed from watched list');
      } else {
        const posterPath = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        await userService.post(`/watched/add`, {
          uid: user.uid,
          movie: { id: movie.id, title: movie.title, poster: posterPath },
        });
        setIsWatched(true);
        toast.success('Added to watched list');
      }
    } catch (error) {
      console.error('Error updating watched list:', error.response?.data || error.message);
      toast.error(error.response?.data?.error || 'Failed to update watched list');
    } finally {
      setWatchedLoading(false);
    }
  };

  const handleStreamingServiceClick = (url) => {
    if (url) window.open(url, '_blank');
  };

  const isStreamingServiceAvailable = (serviceName) => {
    const service = ottProviderMap[serviceName];
    if (!service) return false;
    return isProviderAvailable(service.id, streamingData);
  };

  const getStreamingServiceUrl = (serviceName) => {
    if (!movie) return null;
    const service = ottProviderMap[serviceName];
    if (!service) return null;
    return getProviderUrl(service.id, streamingData, movie.title);
  };

  const fetchStreamingData = async () => {
    try {
      setStreamingLoading(true);
      setStreamingError(null);
      const response = await axios.get(`${API_BASE_URL}/movies/${id}/streaming?region=US`);
      setStreamingData(response.data);
    } catch (error) {
      console.error('Error fetching streaming data:', error);
      setStreamingError('Unable to fetch streaming availability. Please try again later.');
    } finally {
      setStreamingLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !movie) {
    return (
      <div className="movie-detail-page">
        <Navbar />
        <div className="error-container">
          <h2>{error || 'Movie not found'}</h2>
          <button onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
  <div className="movie-detail-page">
    <Navbar />
    <div className="movie-backdrop" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})` }}>
      <div className="backdrop-overlay"></div>
    </div>
    <div className="movie-content">
      <div className="left-column">
        <div className="movie-poster-container">
          <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} className="movie-poster" />
        </div>
        <SearchBar />
        <div className="comments-section">
          <h3>Comments</h3>
          {commentsLoading ? (
            <div className="comments-loading">
              <div className="spinner"></div>
              <p>Loading comments...</p>
            </div>
          ) : commentError ? (
            <div className="comments-error">
              <p>{commentError}</p>
              <button onClick={() => fetchComments()}>Try Again</button>
            </div>
          ) : (
            <>
              <form onSubmit={handleAddComment} className="comment-form">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write your comment..."
                  rows={4}
                  required
                />
                <button type="submit" disabled={commentsLoading}>Post Comment</button>
              </form>
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p>No comments yet.</p>
                ) : (
                  comments.map((comment) => {
                    console.log('Rendering comment:', comment);
                    let formattedDate = 'Unknown date';
                    try {
                      const date = comment.createdAt?.seconds
                        ? new Date(comment.createdAt.seconds * 1000)
                        : comment.createdAt
                        ? new Date(comment.createdAt)
                        : null;
                      formattedDate = date && !isNaN(date) ? date.toLocaleDateString() : 'Unknown date';
                    } catch (err) {
                      console.warn('Invalid date for comment:', comment.id, err);
                    }
                    const avatarInitial = comment.username ? comment.username.charAt(0).toUpperCase() : '?';
                    const displayName = comment.username || 'Unknown User';
                    const commentText = comment.comment || 'No comment text';
                    return (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <div className="user-info">
                            {comment.photoURL ? (
                              <img src={comment.photoURL} alt={displayName} className="user-avatar" />
                            ) : (
                              <div className="no-avatar">{avatarInitial}</div>
                            )}
                            <span className="comment-username">{displayName}</span>
                            <span className="comment-date">{formattedDate}</span>
                          </div>
                        </div>
                        <p className="comment-text">{commentText}</p>
                        {user && user.uid === comment.userId && (
                          <span
                            className="delete-comment-icon"
                            onClick={() => handleDeleteComment(comment.id)}
                            title="Delete comment"
                          >
                            🗑️
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="movie-info">
        <h1 className="movie-title">{movie.title}</h1>
        <div className="movie-meta">
          <span className="movie-year">{movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'}</span>
          <span className="movie-runtime">{movie.runtime ? `${movie.runtime} min` : 'N/A'}</span>
          <span className="movie-rating">IMDb {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
        </div>
        <div className="movie-genres">
          {movie.genres && movie.genres.length > 0 ? (
            movie.genres.map((genre) => <span key={genre.id} className="genre-tag">{genre.name}</span>)
          ) : (
            <span>No genres available</span>
          )}
        </div>
        <div className="movie-overview">
          <h3>Overview</h3>
          <p>{movie.overview || 'No overview available'}</p>
        </div>
        <div className="movie-cast">
          <h3>Cast</h3>
          {movie.credits && movie.credits.cast && movie.credits.cast.length > 0 ? (
            <div className="cast-list">
              {movie.credits.cast.slice(0, 6).map((actor) => (
                <div key={actor.id} className="cast-item">
                  <div className="cast-avatar">
                    {actor.profile_path ? (
                      <img src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} alt={actor.name} />
                    ) : (
                      <div className="no-avatar">{actor.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="cast-info">
                    <div className="cast-name">{actor.name}</div>
                    <div className="cast-character">{actor.character}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No cast information available</p>
          )}
        </div>
        <div className="movie-actions">
          <button
            className={`watchlist-btn ${isInWatchlist ? 'active' : ''} ${watchlistLoading ? 'loading' : ''}`}
            onClick={handleAddToWatchlist}
            disabled={watchlistLoading}
          >
            {watchlistLoading ? 'Updating...' : isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
          <button
            className={`watched-btn ${isWatched ? 'active' : ''} ${watchedLoading ? 'loading' : ''}`}
            onClick={handleAddToWatched}
            disabled={watchedLoading}
          >
            {watchedLoading ? 'Updating...' : isWatched ? 'Remove from Watched' : 'Mark as Watched'}
          </button>
        </div>
        <div className="streaming-section">
          {streamingLoading ? (
            <div className="streaming-loading">
              <div className="spinner"></div>
              <p>Loading streaming availability...</p>
            </div>
          ) : streamingError ? (
            <div className="streaming-error">
              <p>{streamingError}</p>
              <button onClick={() => fetchStreamingData()}>Try Again</button>
            </div>
          ) : (
            <div className="streaming-providers">
              <h3>Streaming Availability</h3>
              {(!streamingData || !streamingData.flatrate || streamingData.flatrate.length === 0) ? (
                <div className="no-providers-message">
                  <p>Currently, there are no streaming providers for the movie.</p>
                </div>
              ) : (
                <>
                  <div className="provider-list">
                    {Object.entries(ottProviderMap).map(([key, service]) => {
                      const isAvailable = isStreamingServiceAvailable(key);
                      const serviceUrl = getStreamingServiceUrl(key);
                      return (
                        <div
                          key={key}
                          className={`provider-item ${isAvailable ? 'available' : 'unavailable'}`}
                          onClick={() => isAvailable && handleStreamingServiceClick(serviceUrl)}
                        >
                          <img src={service.icon} alt={service.name} />
                          <span>{service.name}</span>
                        </div>
                      );
                    })}
                  </div>
                  {streamingData && streamingData.link && (
                    <a href={streamingData.link} target="_blank" rel="noopener noreferrer" className="justwatch-link">
                      Check on JustWatch
                    </a>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    {similarMovies.length > 0 && (
      <div className="similar-movies-container">
        <div className="similar-movies-section">
          <h3>Similar Movies</h3>
          <div className="similar-movies-grid">
            {similarMovies.slice(0, 8).map((movie) => (
              <div key={movie.id} className="similar-movie-card" onClick={() => navigate(`/movie/${movie.id}`)}>
                <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} />
                <p>{movie.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
);
}

export default MovieDetailPage;