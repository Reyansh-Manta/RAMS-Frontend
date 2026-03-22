import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RiRobot2Fill, RiShieldUserLine, RiLogoutBoxRLine } from 'react-icons/ri';
import { motion } from 'framer-motion';
import './Navbar.css';

export default function Navbar() {
  const { isAdmin, logout } = useAuth();
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
