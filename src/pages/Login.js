import React, { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, signInWithGoogle } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";
import GoogleLogo from "../assets/google-logo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/auth.scss";
import loginBgImage from "../assets/login-bg.jpg"; // Add this import for your login background

const Login = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      console.error("Login Error:", error.message);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErrorMsg("Invalid email or password. Please try again.");
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMsg("Too many failed attempts. Please try again later.");
      } else {
        setErrorMsg(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (error) {
      console.error("Google Login Error:", error.message);
      setErrorMsg("Google sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg("Please enter your email to reset your password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await sendPasswordResetEmail(auth, email);
      setErrorMsg("Password reset email sent! Check your inbox.");
    } catch (error) {
      console.error("Error Sending Reset Email:", error.message);
      setErrorMsg("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-container login-layout ${isPageLoaded ? 'loaded' : ''}`}>
      <div className="auth-box">
        {user ? (
          <div className="user-welcome">
            <h2>Welcome, {user.displayName || user.email}</h2>
            <button onClick={logout} disabled={loading}>
              {loading ? "Processing..." : "Logout"}
            </button>
          </div>
        ) : (
          <>
            <h2>Sign in to Streamverse</h2>

            {errorMsg && <p className="error-message">{errorMsg}</p>}

            <form onSubmit={handleEmailLogin}>
              <div className="input-group">
                <input 
                  type="email" 
                  placeholder=" " 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
                <label>Email</label>
              </div>

              <div className="input-group">
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder=" " 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <label>Password</label>
                <span 
                  className="password-toggle" 
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="divider">
              <span>OR</span>
            </div>

            <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
              <img src={GoogleLogo} alt="Google" />
              Sign in with Google
            </button>

            <button className="forgot-btn" onClick={handleForgotPassword} disabled={loading}>
              Forgot Password?
            </button>

            <p>Don't have an account? <a href="/signup">Sign up</a></p>
          </>
        )}
      </div>
      <div className="auth-image" style={{ backgroundImage: `url(${loginBgImage})` }}></div>
    </div>
  );
};

export default Login;