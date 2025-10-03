import { createContext, useContext, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getIdToken } from "firebase/auth"; 
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import LoadingScreen from "../components/LoadingScreen";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize dark mode from localStorage or default to false (light mode)
    return localStorage.getItem("theme") === "dark";
  });

  // Update document class and localStorage when dark mode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Monitor Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
  setUser(currentUser);
  setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Login with Firebase
  const login = async (email, password) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Login error:", error.message);
      throw error;
    }
  };

  // Logout with Firebase
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error.message);
      throw error;
    }
  };

  const getToken = async () => {
    if (auth.currentUser) {
      return await getIdToken(auth.currentUser, true);
    }
    return null;
  };

  // Show loading screen while auth state is initializing
  if (loading) {
    return <LoadingScreen />;
  }

  // Context value including all auth and dark mode functions
  const value = {
    user,
    setUser, // Included from second version for external user state updates
    login,
    logout,
    loading,
    isDarkMode,
    toggleDarkMode,
    getToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);