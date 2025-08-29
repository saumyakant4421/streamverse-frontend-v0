
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
const movieService = axios.create({
  baseURL: getBaseURL(
    "/api/movies",
    "VITE_MOVIE_API_URL",
    "https://streamverse-movie-service.onrender.com/api/movies"
  ),
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

const franchiseService = axios.create({
  baseURL: getBaseURL(
    "/api/franchises",
    "VITE_FRANCHISE_API_URL",
    "https://backend-franchiseservice-v0.onrender.com/api/franchises"
  ),
});

const additionalService = axios.create({
  baseURL: getBaseURL(
    "/api/additional",
    "VITE_ADDITIONAL_API_URL",
    "https://backend-additionalservice-v0.onrender.com/api/additional"
  ),
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
    const user = getAuth().currentUser;
    if (user) {
      const token = await user.getIdToken(true);
      config.headers.Authorization = `Bearer ${token}`;
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
