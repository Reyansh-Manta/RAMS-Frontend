import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RiRobot2Fill, RiShieldUserLine, RiLogoutBoxRLine, RiSunLine, RiMoonLine, RiDatabase2Line, RiQuestionAnswerLine } from 'react-icons/ri';
import { motion } from 'framer-motion';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, isAdmin, logout, deleteAccount } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <motion.nav
      className="navbar glass"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Link to="/" className="navbar-brand">
        <div className="navbar-logo">
          <RiRobot2Fill />
        </div>
        <span className="navbar-title">RAMS</span>
        <span className="navbar-subtitle">AI Assistant</span>
      </Link>

      <div className="navbar-actions">
        <button className="btn-icon" onClick={toggleTheme} aria-label="Toggle theme" style={{ marginRight: '8px' }}>
          {theme === 'light' ? <RiMoonLine size={20} /> : <RiSunLine size={20} />}
        </button>

        {isAuthenticated ? (
          <>
            {isAdmin && !isAdminRoute && (
              <Link to="/admin/dashboard" className="btn-secondary navbar-btn">
                <RiShieldUserLine size={16} />
                Dashboard
              </Link>
            )}
            <Link to="/faq" className="btn-secondary navbar-btn">
              <RiQuestionAnswerLine size={16} />
              FAQ
            </Link>
            {isAdminRoute && (
              <>
                <Link to="/admin/dashboard" className="btn-secondary navbar-btn">
                  <RiDatabase2Line size={16} />
                  KB
                </Link>
                <Link to="/admin/users" className="btn-secondary navbar-btn">
                  <RiShieldUserLine size={16} />
                  Users
                </Link>
                <Link to="/" className="btn-secondary navbar-btn">
                  <RiRobot2Fill size={16} />
                  Chat
                </Link>
              </>
            )}
            <button onClick={logout} className="btn-secondary navbar-btn navbar-btn-logout">
              <RiLogoutBoxRLine size={16} />
              Logout
            </button>
            <button 
              onClick={() => {
                if(window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  deleteAccount();
                }
              }} 
              className="btn-secondary navbar-btn navbar-btn-logout"
              style={{ color: '#ff6b6b', borderColor: 'rgba(255, 107, 107, 0.3)' }}
            >
              Delete Account
            </button>
          </>
        ) : (
          <Link to="/login" className="navbar-admin-link">
            <RiShieldUserLine size={18} />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </motion.nav>
  );
}
