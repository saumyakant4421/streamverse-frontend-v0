
import axios from "axios";
import { getAuth } from "firebase/auth";

// Toggle for using local or remote (Render) services
const useLocal = import.meta.env.VITE_USE_LOCAL_API === 'true';
const isProduction = import.meta.env.PROD;

// Helper to choose baseURL for each service
function getBaseURL(localPath, remoteEnvVar, remoteDefault) {
  if (isProduction) {
    return useLocal ? localPath : (import.meta.env[remoteEnvVar] || remoteDefault);
  } else {
    return localPath;
  }
}

// All service instances
// When running locally (not production), use the deployed movie-service run.app URL directly
// This ensures the frontend talks to the hosted movie service while other services may be local.
const movieService = axios.create({
  baseURL: isProduction
    ? getBaseURL(
        "/api/movies",
        "VITE_MOVIE_API_URL",
        "https://streamverse-movie-service.onrender.com/api/movies"
      )
    : (import.meta.env.VITE_MOVIE_API_URL || "https://movie-service-285531167611.us-central1.run.app/api/movies"),
});

// Build user service baseURL with safeguard for legacy '/api/users' path
let userBase = getBaseURL(
  "/api/user",
  "VITE_USER_API_URL",
  "https://backend-userservice-v0.onrender.com/api/user"
);
if (isProduction && /\/api\/users(\/?$)/.test(userBase)) {
  userBase = userBase.replace(/\/api\/users(\/?$)/, "/api/user$1");
}
const userService = axios.create({
  baseURL: userBase,
});

// Build franchise service base URL and ensure it always targets the '/api/franchises' path.
let _franchiseBase = import.meta.env.VITE_FRANCHISE_API_URL ||
  (useLocal ? "http://localhost:5003/api/franchises" : "https://franchise-service-285531167611.us-central1.run.app/api/franchises");
// Trim trailing slashes
_franchiseBase = _franchiseBase.replace(/\/+$/, '');
// If the provided value doesn't already include the '/api/franchises' path, append it.
if (!/\/api\/franchises(\/?$)/.test(_franchiseBase)) {
  _franchiseBase = _franchiseBase + '/api/franchises';
}
const franchiseService = axios.create({
  baseURL: _franchiseBase,
});

const additionalService = axios.create({
  baseURL: isProduction
    ? getBaseURL(
        "/api/additional",
        "VITE_ADDITIONAL_API_URL",
        "https://backend-additionalservice-v0.onrender.com/api/additional"
      )
    : (import.meta.env.VITE_ADDITIONAL_API_URL || "http://localhost:4004/api/additional"),
});

const recommendationService = axios.create({
  baseURL: getBaseURL(
    "/api/recommendations",
    "VITE_RECOMMENDATION_API_URL",
    "https://recommendation-api-127j.onrender.com/api/recommendations"
  ),
});
const watchPartyService = axios.create({
  baseURL: "/api/tools/watchparty",
});
const marathonService = axios.create({
  baseURL: "/api/tools/marathon",
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
    // If auth isn't ready yet (currentUser null) wait briefly for it to initialize.
    // This reduces race conditions where components make requests before onAuthStateChanged fires.
    let user = getAuth().currentUser;
    if (!user) {
      // Wait up to 2 seconds for auth state to become available, polling briefly.
      const start = Date.now();
      while (!user && Date.now() - start < 2000) {
        // small delay
        // eslint-disable-next-line no-await-in-loop
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
        // If token retrieval fails, continue without token so error handling can occur normally
        console.warn('Failed to obtain ID token for request:', err && err.message ? err.message : err);
      }
    }
    return config;
  });

  service.interceptors.response.use(
    response => response,
    async error => {
      if (error.response && error.response.status === 401) {
        // Log out user and redirect to login
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
