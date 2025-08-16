import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FaTrash } from 'react-icons/fa';
import MarathonSearchBar from './MarathonSearch';
import '../styles/marathon-planner.scss';

const API_BASE_URL = 'http://localhost:4004/api/tools/marathon';

const MovieMarathonPlanner = () => {
  const { user } = useAuth();
  const [bucket, setBucket] = useState([]);
  const [totalRuntime, setTotalRuntime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const movieService = axios.create({
    baseURL: API_BASE_URL,
  });

  movieService.interceptors.request.use(
    async (config) => {
      if (user && typeof user.getIdToken === 'function') {
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  useEffect(() => {
    if (user) {
      fetchBucket();
    } else {
      setBucket([]);
      setTotalRuntime(null);
      setLoading(false);
      setError(null);
    }
  }, [user]);

  const fetchBucket = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await movieService.get('/bucket');
      setBucket(response.data.movies || []);
      await calculateRuntime();
    } catch (err) {
      setError('Failed to load bucket');
      toast.error('Failed to load bucket');
    } finally {
      setLoading(false);
    }
  };

  const addToBucket = async (movie) => {
    if (!user) {
      toast.error('Please log in to add movies');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await movieService.post('/bucket/add', { movieId: movie.id });
      setBucket(response.data.movies);
      toast.success('Movie added to bucket');
      await calculateRuntime();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add movie');
    } finally {
      setLoading(false);
    }
  };

  const removeFromBucket = async (movieId) => {
    if (!user) {
      toast.error('Please log in to remove movies');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await movieService.delete(`/bucket/remove/${movieId}`);
      setBucket(response.data.movies);
      toast.success('Movie removed from bucket');
      await calculateRuntime();
    } catch (err) {
      toast.error('Failed to remove movie');
    } finally {
      setLoading(false);
    }
  };

  const calculateRuntime = async () => {
    if (!user) {
      setTotalRuntime(null);
      return;
    }
    try {
      const response = await movieService.get('/bucket/runtime');
      setTotalRuntime(response.data);
    } catch (err) {
      setTotalRuntime(null);
      toast.error('Failed to calculate runtime');
    }
  };

  if (!user) {
    return (
      <div className="tools-marathon-planner">
        <MarathonSearchBar onAddToBucket={addToBucket} bucket={bucket} user={user} />
        <div className="tools-bucket-section">
          <h2>Your Marathon Bucket (0/30)</h2>
          <p>Please log in to create a movie marathon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tools-marathon-planner">
      <MarathonSearchBar onAddToBucket={addToBucket} bucket={bucket} user={user} />
      {error && <p className="tools-error">{error}</p>}
      {loading && <div className="tools-spinner">Loading...</div>}

      <div className="tools-bucket-section">
        <h2>Your Marathon Bucket ({bucket.length}/30)</h2>
        {bucket.length === 0 ? (
          <p>No movies in your bucket yet.</p>
        ) : (
          <div className="tools-bucket-list">
            {bucket.map((movie) => (
              <div key={movie.id} className="tools-bucket-item">
                <img
                  src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                  alt={movie.title}
                />
                <div className="tools-bucket-info">
                  <h3>{movie.title}</h3>
                  <p>{movie.runtime} min</p>
                  <button onClick={() => removeFromBucket(movie.id)}>
                    <FaTrash /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {totalRuntime && (
          <div className="tools-runtime-summary">
            <h3>Total Runtime</h3>
            <p>
              {totalRuntime.formatted} ({totalRuntime.totalMinutes} minutes)
            </p>
            <p>{totalRuntime.movieCount} movies</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieMarathonPlanner;