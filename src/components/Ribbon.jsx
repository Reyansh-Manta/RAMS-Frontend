import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  RiRobot2Fill, RiChat3Line, RiQuestionAnswerLine,
  RiDatabase2Line, RiBarChartBoxLine, RiTeamLine,
  RiSunLine, RiMoonLine, RiUser3Line, RiMoreFill
} from 'react-icons/ri';
import './Ribbon.css';

export default function Ribbon({ onToggleRightDrawer }) {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="app-ribbon glass">
      {/* Top RAMS Logo */}
      <Link to="/" className="ribbon-brand" title="RAMS AI">
        <div className="ribbon-logo">
          <RiRobot2Fill size={18} />
        </div>
        <span className="ribbon-brand-text">RAMS</span>
      </Link>

      {/* Middle Navigation Group */}
      <nav className="ribbon-nav">
        <Link
          to="/"
          className={`ribbon-nav-item ${isActive('/') ? 'active' : ''}`}
          title="AI Chat"
        >
          <RiChat3Line size={20} />
          <span className="ribbon-nav-tooltip">Chat</span>
        </Link>

        <Link
          to="/faq"
          className={`ribbon-nav-item ${isActive('/faq') ? 'active' : ''}`}
          title="FAQ Hub"
        >
          <RiQuestionAnswerLine size={20} />
          <span className="ribbon-nav-tooltip">FAQ</span>
        </Link>

        {isAuthenticated && isSuperAdmin && (
          <>
            <Link
              to="/admin/dashboard"
              className={`ribbon-nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}
              title="Knowledge Base"
            >
              <RiDatabase2Line size={20} />
              <span className="ribbon-nav-tooltip">Knowledge Base</span>
            </Link>

            <Link
              to="/admin/stats"
              className={`ribbon-nav-item ${isActive('/admin/stats') ? 'active' : ''}`}
              title="Pipeline Stats"
            >
              <RiBarChartBoxLine size={20} />
              <span className="ribbon-nav-tooltip">Stats</span>
            </Link>

            <Link
              to="/admin/users"
              className={`ribbon-nav-item ${isActive('/admin/users') ? 'active' : ''}`}
              title="User Authority Management"
            >
              <RiTeamLine size={20} />
              <span className="ribbon-nav-tooltip">Users</span>
            </Link>
          </>
        )}
      </nav>

      {/* Bottom Settings Group */}
      <div className="ribbon-bottom">
        <button
          className="ribbon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <RiMoonLine size={20} /> : <RiSunLine size={20} />}
        </button>

        {!isAuthenticated ? (
          <Link to="/login" className="ribbon-btn ribbon-login-btn" title="Sign In">
            <RiUser3Line size={20} />
            <span className="ribbon-nav-tooltip">Sign In</span>
          </Link>
        ) : (
          <button
            className="ribbon-btn ribbon-more-btn"
            onClick={onToggleRightDrawer}
            title="More Options"
          >
            <RiMoreFill size={20} />
            <span className="ribbon-nav-tooltip">Menu</span>
          </button>
        )}
      </div>
    </aside>
  );
}
