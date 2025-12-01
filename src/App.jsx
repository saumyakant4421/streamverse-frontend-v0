import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import UserPage from "./pages/Userpage";
import MoviePage from "./pages/MoviePage";
import RecommendPage from "./pages/RecommendPage";
import ToolsPage from "./pages/ToolsPage";
import FranchiseSearch from './pages/Franchise';
import FranchisePage from './components/FranchisePage';
import FranchiseDetail from './pages/FranchiseDetail';
import WatchPartyChat from './pages/WatchPartyChat';
// import SocialPage from './pages/Socials';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>;
  }
  return user ? children : <Navigate to="/login" />;
};


import FloatingAiButton from "./components/FloatingAiButton";
import Maintenance from "./components/fallback/Maintenance";

function App() {
  const MAINTENANCE = true; // set to `false` to disable maintenance mode
  if (MAINTENANCE) return <Maintenance />;
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <FloatingAiButton />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <UserPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movie/:id"
          element={
            <ProtectedRoute>
              <MoviePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <RecommendPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools"
          element={
            <ProtectedRoute>
              <ToolsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/watchparty/chat/:watchPartyId"
          element={
            <ProtectedRoute>
              <WatchPartyChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/franchises"
          element={
            <ProtectedRoute>
              <FranchiseSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/franchises/:collectionId"
          element={
            <ProtectedRoute>
              <FranchisePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/popularfranchises/:collectionId"
          element={
            <ProtectedRoute>
              <FranchiseDetail />
            </ProtectedRoute>
          }
        />
        {/* <Route
          path="/social"
          element={
            <ProtectedRoute>
              <SocialPage />
            </ProtectedRoute>
          }
        /> */}
      </Routes>
    </AuthProvider>
  );
}

export default App;