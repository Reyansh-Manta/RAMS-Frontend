import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RiShieldUserLine, RiArrowLeftLine } from 'react-icons/ri';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { googleLogin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard or home if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

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
    } else if (result.registered === false) {
      // Redirect new user to registration flow
      navigate('/register', {
        state: {
          idToken: response.credential,
          email: result.data.email,
          name: result.data.name
        }
      });
    }
    // If successful and registered, the useEffect above will redirect them.
  };

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <motion.div
        className="login-card glass-card"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="login-back">
          <RiArrowLeftLine size={18} />
          Back to Chat
        </Link>

        <div className="login-header">
          <div className="login-icon">
            <RiShieldUserLine size={28} />
          </div>
          <h1 className="login-title">RAMS Sign In</h1>
          <p className="login-desc">Sign in with Google to continue</p>
        </div>

        {error && (
          <motion.div
            className="login-error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '20px' }}
          >
            {error}
          </motion.div>
        )}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <span className="login-spinner" />
          </div>
        )}

        {/* Official Google Button */}
        <div id="google-signin-button" className="google-login-container" style={{ display: isLoading ? 'none' : 'block' }}></div>

        <p className="login-footer">
          By continuing, you agree to our Terms of Service.
        </p>
      </motion.div>
    </div>
  );
}
