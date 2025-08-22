import axios from "axios";
import { getAuth } from "firebase/auth";

// Check if we're in production (no proxy available)
const isProduction = import.meta.env.PROD;

const movieService = axios.create({
  baseURL: isProduction
    ? (import.meta.env.VITE_MOVIE_API_URL || "https://streamverse-movie-service.onrender.com/api/movies")
    : "/api/movies",
});

const userService = axios.create({
  baseURL: isProduction
    ? (import.meta.env.VITE_USER_API_URL || "https://backend-userservice-v0.onrender.com/api/users")
    : "/api/user",
});

const watchPartyService = axios.create({
  baseURL: isProduction
    ? (import.meta.env.VITE_WATCHPARTY_API_URL || "https://your-watchparty-module.onrender.com/api/tools/watchparty")
    : "/api/tools/watchparty",
});

const recommendationService = axios.create({
  baseURL: isProduction
    ? (import.meta.env.VITE_RECOMMENDATION_API_URL || "https://your-recommendation-module.onrender.com/api/recommendations")
    : "/api/recommendations",
});

const marathonService = axios.create({
  baseURL: isProduction
    ? (import.meta.env.VITE_MARATHON_API_URL || "https://your-marathon-module.onrender.com/api/tools/marathon")
    : "/api/tools/marathon",
});

const franchiseService = axios.create({
  baseURL: isProduction
    ? (import.meta.env.VITE_FRANCHISE_API_URL || "https://backend-franchiseservice-v0.onrender.com/api/franchises")
    : "/api/franchises",
});
// Additional Service (new, only live URL for production)
const additionalService = axios.create({
  baseURL: isProduction
    ? (import.meta.env.VITE_ADDITIONAL_API_URL || "https://backend-additionalservice-v0.onrender.com/api/additional")
    : "/api/additional",
});

const services = [
  movieService,
  userService,
  watchPartyService,
  recommendationService,
  marathonService,
  franchiseService,
  additionalService,
];

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
