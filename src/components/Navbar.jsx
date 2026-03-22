import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RiRobot2Fill, RiShieldUserLine, RiLogoutBoxRLine, RiSunLine, RiMoonLine } from 'react-icons/ri';
import { motion } from 'framer-motion';
import './Navbar.css';

export default function Navbar() {
  const { isAdmin, logout } = useAuth();
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

        {isAdmin && isAdminRoute ? (
          <>
            <Link to="/" className="btn-secondary navbar-btn">
              <RiRobot2Fill size={16} />
              Chat
            </Link>
            <button onClick={logout} className="btn-secondary navbar-btn navbar-btn-logout">
              <RiLogoutBoxRLine size={16} />
              Logout
            </button>
          </>
        ) : (
          <Link to="/admin" className="navbar-admin-link">
            <RiShieldUserLine size={18} />
            <span>Admin</span>
          </Link>
        )}
      </div>
    </motion.nav>
  );
}
