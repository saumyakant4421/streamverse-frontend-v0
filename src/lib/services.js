import axios from "axios";
import { getAuth } from "firebase/auth";

// Check if we're in production (no proxy available)
const isProduction = import.meta.env.PROD;

const movieService = axios.create({
  baseURL: isProduction 
    ? (import.meta.env.VITE_MOVIE_API_URL || "https://your-movie-module.onrender.com/api/movies")
    : "/api/movies",
});

const userService = axios.create({
  baseURL: isProduction
    ? (import.meta.env.VITE_USER_API_URL || "https://your-user-module.onrender.com/api/user")
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
    ? (import.meta.env.VITE_FRANCHISE_API_URL || "https://your-franchise-module.onrender.com/api/franchises")
    : "/api/franchises",
});

const services = [
  movieService,
  userService,
  watchPartyService,
  recommendationService,
  marathonService,
  franchiseService,
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
});

export {
  movieService,
  userService,
  watchPartyService,
  recommendationService,
  marathonService,
  franchiseService,
};
