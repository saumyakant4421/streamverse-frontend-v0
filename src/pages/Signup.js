import { useState, useRef, useEffect } from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/auth.scss";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import GoogleLogo from "../assets/google-logo.png";
import signupBgImage from "../assets/signup-bg.jpg";
import { signInWithGoogle } from "../firebaseConfig";

const API_BASE_URL = import.meta.env.REACT_APP_API_URL;

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isNameStep, setIsNameStep] = useState(false);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  
  const navigate = useNavigate();
  const otpInputRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isNameStep && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isNameStep]);

  const handleSendOtp = async () => {
    // Clear previous messages
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.includes("@")) {
      setErrorMsg("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/user/send-otp`, { email });
      setSuccessMsg("OTP sent to your email!");
      setIsOtpSent(true);
      setTimeout(() => otpInputRef.current?.focus(), 500);
    } catch (error) {
      setErrorMsg(error.response?.data?.error || "Failed to send OTP");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setErrorMsg("");
    setSuccessMsg("");
  
    if (otp.length !== 6) {
      setErrorMsg("OTP must be 6 characters.");
      return;
    }
  
    // Validate OTP contains only alphanumeric characters (removed the requirement for 
    // lowercase, uppercase, and numbers to all be present)
    const isValidOtp = /^[a-zA-Z0-9]{6}$/.test(otp);
  
    if (!isValidOtp) {
      setErrorMsg("OTP must contain only letters and numbers.");
      return;
    }
  
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/verify-otp`, { 
        email, 
        otp, 
        password 
      });
      
      // Backend now creates the Firebase user during OTP verification
      setUserId(response.data.uid);
      setIsOtpVerified(true);
      setIsNameStep(true);
      
    } catch (error) {
      setErrorMsg(error.response?.data?.error || "Invalid OTP");
    }
    setLoading(false);
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
  
    setLoading(true);
    try {
      // Use the updateUserName endpoint to update user's name
      await axios.post(`${API_BASE_URL}/api/user/update-name`, {
        uid: userId,
        name: name.trim()
      });
      
      setSuccessMsg("Registration complete! Redirecting to streamverse...");
      
      // Automatically sign in after registration
      try {
        // Sign in with Firebase using email and password
        await signInWithEmailAndPassword(auth, email, password);
        
        // Redirect to 
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } catch (signInError) {
        console.error("Error signing in after registration:", signInError);
        setErrorMsg("Registration successful but couldn't sign in automatically. Please log in.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
      
    } catch (error) {
      setErrorMsg(error.response?.data?.error || "Failed to update name");
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        navigate("/");
      }
    } catch (error) {
      setErrorMsg("Google signup failed. Please try again.");
    }
  };

  // Render different forms based on current step
  const renderSignupForm = () => {
    if (isNameStep) {
      return (
        <form onSubmit={handleNameSubmit}>
          <div className="input-group">
            <input 
              type="text" 
              placeholder=" " 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              ref={nameInputRef}
              required 
            />
            <label>Full Name</label>
          </div>
          {isOtpVerified && <p className="success-message">OTP verified successfully! Please enter your name to complete registration.</p>}
          <button type="submit" disabled={loading || !name.trim()}>
            Complete Signup
          </button>
        </form>
      );
    }
    
    if (isOtpSent && !isOtpVerified) {
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }}>
          <div className="input-group">
            <input 
              type="text" 
              placeholder=" " 
              value={otp} 
              onChange={(e) => {
                // Accept alphanumeric characters only (both cases) and limit to 6 chars
                const filtered = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
                setOtp(filtered);
              }}
              ref={otpInputRef} 
              required 
            />
            <label>Enter OTP</label>
          </div>
          <button type="submit" disabled={loading || otp.length !== 6}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button 
            type="button" 
            className="text-button"
            onClick={handleSendOtp} 
            disabled={loading}
          >
            Resend OTP
          </button>
        </form>
      );
    }
    
    // Initial email/password form
    return (
      <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }}>
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
        
        <div className="input-group">
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder=" " 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
          />
          <label>Confirm Password</label>
        </div>
        
        <button type="submit" disabled={loading || !email || !password || password !== confirmPassword}>
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>
    );
  };

  return (
    <div className={`auth-container signup-layout ${isPageLoaded ? 'loaded' : ''}`}>
      <div className="auth-box">
        <h2>{isNameStep ? "Complete Your Profile" : "Create Your Account"}</h2>
        
        {!isNameStep && errorMsg && <p className="error-message">{errorMsg}</p>}
        {!isNameStep && successMsg && <p className="success-message">{successMsg}</p>}
        
        {renderSignupForm()}
        
        {!isOtpSent && (
          <>
            <div className="divider"><span>OR</span></div>
            
            <button 
              type="button"
              className="google-btn" 
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <img src={GoogleLogo} alt="Google" /> Sign up with Google
            </button>
          </>
        )}
        
        {!isNameStep && <p>Already have an account? <a href="/login">Log in</a></p>}
      </div>
      <div className="auth-image" style={{ backgroundImage: `url(${signupBgImage})` }}></div>
    </div>
  );
};

export default Signup;