import axios from "axios";
import { getAuth } from "firebase/auth";

// Create axios instance with relative baseURL
const api = axios.create({
  baseURL: "/api", 
});

// Attach Firebase token automatically
api.interceptors.request.use(async (config) => {
  const user = getAuth().currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
