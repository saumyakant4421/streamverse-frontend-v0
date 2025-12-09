
import axios from "axios";
import { getAuth } from "firebase/auth";

// Respect Vite environment variables
const useLocal = import.meta.env.VITE_USE_LOCAL_API === 'true';
const isDev = import.meta.env.DEV === true;

// Helper to choose baseURL for each service
function getBaseURL(envVar, localDefault, remoteDefault) {
  // If explicit env var is set, use it
  if (import.meta.env[envVar]) {
    return import.meta.env[envVar];
  }
  // In development, prefer local
  if (isDev) {
    return localDefault;
  }
  // In production, use remote
  return remoteDefault;
}

const movieService = axios.create({
  baseURL: getBaseURL(
    "VITE_MOVIE_API_URL",
    "http://localhost:5002/api/movies",
    "https://movie-service-285531167611.us-central1.run.app/api/movies"
  ),
});

const userService = axios.create({
  baseURL: getBaseURL(
    "VITE_USER_API_URL",
    "http://localhost:5001/api/user",
    "https://backend-userservice-v0.onrender.com/api/user"
  ),
});

const franchiseService = axios.create({
  baseURL: getBaseURL(
    "VITE_FRANCHISE_API_URL",
    "http://localhost:5003/api/franchises",
    "https://franchise-service-285531167611.us-central1.run.app/api/franchises"
  ),
});

const additionalService = axios.create({
  baseURL: getBaseURL(
    "VITE_ADDITIONAL_API_URL",
    "http://localhost:4004/api/additional",
    "https://backend-additionalservice-v0.onrender.com/api/additional"
  ),
});

const recommendationService = axios.create({
  baseURL: getBaseURL(
    "VITE_RECOMMENDATION_API_URL",
    "http://localhost:5004/api/recommendations",
    "https://recommendation-api-127j.onrender.com/api/recommendations"
  ),
});

const watchPartyService = axios.create({
  baseURL: getBaseURL(
    "VITE_WATCHPARTY_API_URL",
    "http://localhost:4004/api/tools/watchparty",
    "https://backend-additionalservice-v0.onrender.com/api/tools/watchparty"
  ),
});

const marathonService = axios.create({
  baseURL: getBaseURL(
    "VITE_MARATHON_API_URL",
    "http://localhost:4004/api/tools/marathon",
    "https://backend-additionalservice-v0.onrender.com/api/tools/marathon"
  ),
});
// Add socialService here if needed

const services = [
  movieService,
  userService,
  watchPartyService,
  recommendationService,
  marathonService,
  franchiseService,
  additionalService,
];

// Attach interceptors for auth and 401 handling
services.forEach((service) => {
  service.interceptors.request.use(async (config) => {
    let user = getAuth().currentUser;
    if (!user) {
      const start = Date.now();
      while (!user && Date.now() - start < 2000) {
        await new Promise((r) => setTimeout(r, 100));
        user = getAuth().currentUser;
      }
    }
    if (user) {
      try {
        const token = await user.getIdToken(true);
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      } catch (err) {
        console.warn('Failed to obtain ID token for request:', err && err.message ? err.message : err);
      }
    }
    return config;
  });

  service.interceptors.response.use(
    response => response,
    async error => {
      if (error.response && error.response.status === 401) {
        const { signOut } = await import("firebase/auth");
        await signOut(getAuth());
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );
});

export {
  movieService,
  userService,
  watchPartyService,
  recommendationService,
  marathonService,
  franchiseService,
  additionalService,
};
