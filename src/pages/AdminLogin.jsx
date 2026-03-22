import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RiShieldUserLine, RiLockLine, RiUserLine, RiEyeLine, RiEyeOffLine, RiArrowLeftLine } from 'react-icons/ri';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './AdminLogin.css';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  if (isAdmin) {
    navigate('/admin/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    const result = login(username, password);
    if (result.success) {
      navigate('/admin/dashboard');
    } else {
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
          <h1 className="admin-login-title">Admin Access</h1>
          <p className="admin-login-desc">Sign in to manage the knowledge base</p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="admin-login-field">
            <label className="admin-login-label">Username</label>
            <div className="admin-login-input-wrap">
              <RiUserLine className="admin-login-input-icon" size={18} />
              <input
                type="text"
                className="input-field admin-login-input"
                placeholder="Enter username"
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

        <p className="admin-login-footer">
          Protected area. Only authorized admin users can access the dashboard.
        </p>
      </motion.div>
    </div>
  );
}
