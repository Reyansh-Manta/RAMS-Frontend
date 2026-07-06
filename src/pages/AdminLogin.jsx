import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  RiShieldUserLine, RiLockLine, RiUserLine, RiEyeLine, 
  RiEyeOffLine, RiArrowLeftLine, RiGoogleFill 
} from 'react-icons/ri';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './AdminLogin.css';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, googleLogin, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if authenticated and admin
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        // If logged in but not an admin, show error or redirect to home page
        setError('Access denied: You do not have administrator permissions.');
      }
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Initialize Google Sign-In
  useEffect(() => {
    const initGoogle = () => {
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1047124235882-fakeclientid.apps.googleusercontent.com', 
            callback: handleGoogleCallback,
          });
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            { theme: 'outline', size: 'large', width: '100%' }
          );
        } catch (err) {
          console.warn('Google Auth Init Failed:', err);
        }
      }
    };

    // Wait slightly for Google script to load if it hasn't
    const timer = setTimeout(initGoogle, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleCallback = async (response) => {
    setError('');
    setIsLoading(true);
    const result = await googleLogin(response.credential);
    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  const handleDevGoogleLogin = async () => {
    // Development fallback to bypass real Google OAuth popups locally
    setError('');
    setIsLoading(true);
    const result = await googleLogin('mock_google_id_token');
    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const result = await login(username.trim(), password.trim());
    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {/* Background decoration */}
      <div className="admin-login-bg">
        <div className="admin-login-orb admin-login-orb-1" />
        <div className="admin-login-orb admin-login-orb-2" />
        <div className="admin-login-orb admin-login-orb-3" />
      </div>

      <motion.div
        className="admin-login-card glass-card"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="admin-login-back">
          <RiArrowLeftLine size={18} />
          Back to Chat
        </Link>

        <div className="admin-login-header">
          <div className="admin-login-icon">
            <RiShieldUserLine size={28} />
          </div>
          <h1 className="admin-login-title">RAMS Authorization</h1>
          <p className="admin-login-desc">Sign in with Google or credentials</p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="admin-login-field">
            <label className="admin-login-label">Username or Email</label>
            <div className="admin-login-input-wrap">
              <RiUserLine className="admin-login-input-icon" size={18} />
              <input
                type="text"
                className="input-field admin-login-input"
                placeholder="Enter username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="admin-login-field">
            <label className="admin-login-label">Password</label>
            <div className="admin-login-input-wrap">
              <RiLockLine className="admin-login-input-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field admin-login-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="admin-login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              className="admin-login-error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            className="btn-primary admin-login-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="admin-login-spinner" />
            ) : (
              <>
                <RiShieldUserLine size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="admin-login-divider">OR</div>

        {/* Official Google Button */}
        <div id="google-signin-button" className="google-login-container"></div>

        {/* Development Fallback Google Button */}
        <button 
          onClick={handleDevGoogleLogin} 
          className="btn-secondary" 
          style={{ width: '100%', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <RiGoogleFill size={18} />
          Sign In with Google (Dev Fallback)
        </button>

        <p className="admin-login-footer">
          Protected area. Authorized users can access the dashboard or ask questions in the chat.
        </p>
      </motion.div>
    </div>
  );
}
