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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { googleLogin, isAuthenticated, isAdmin } = useAuth();
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
          <p className="admin-login-desc">Sign in with Google</p>
        </div>

        {error && (
          <motion.div
            className="admin-login-error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '20px' }}
          >
            {error}
          </motion.div>
        )}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <span className="admin-login-spinner" />
          </div>
        )}

        {/* Official Google Button */}
        <div id="google-signin-button" className="google-login-container" style={{ display: isLoading ? 'none' : 'block' }}></div>

        <p className="admin-login-footer">
          Protected area. Authorized users can access the dashboard or ask questions in the chat.
        </p>
      </motion.div>
    </div>
  );
}
