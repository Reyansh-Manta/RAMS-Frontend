import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { RiMenuLine, RiMoreFill, RiUser3Line, RiRobot2Fill } from 'react-icons/ri';
import './Navbar.css';

export default function Navbar({ onToggleSidebar, onToggleRightDrawer }) {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const { messages } = useChat();
  const location = useLocation();

  // Resolve clean title text depending on active route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'AI Chat';
    if (path === '/faq') return 'FAQ Database';
    if (path === '/admin/dashboard') return 'Knowledge Base Docs';
    if (path === '/admin/stats') return 'System Statistics';
    if (path === '/admin/users') return 'User Management';
    if (path === '/login') return 'Authentication';
    if (path === '/register') return 'Registration';
    return 'RAMS AI';
  };

  return (
    <header className="navbar-header-bar glass">
      {/* Unified Brand Logo area on the far left */}
      <div className="navbar-brand-group">
        <Link to="/" className="navbar-logo-link" title="RAMS AI">
          <div className="navbar-logo-box">
            <RiRobot2Fill size={18} />
          </div>
          <span className="navbar-brand-text">RAMS</span>
        </Link>
      </div>

      <div className="navbar-left-content">
        {/* Mobile Sidebar Menu trigger */}
        <button 
          className="navbar-mobile-trigger" 
          onClick={onToggleSidebar}
          title="Toggle conversation list"
        >
          <RiMenuLine size={20} />
        </button>

        {/* Directory Title Breadcrumb */}
        <div className="navbar-breadcrumb">
          <span className="breadcrumb-main">{getPageTitle()}</span>
          {location.pathname === '/' && messages.length > 0 && (
            <>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-sub">Active Session</span>
            </>
          )}
        </div>
      </div>

      {/* Quick context info */}
      <div className="navbar-right">
        {isAuthenticated && isSuperAdmin && (
          <span className="navbar-role-tag">Super Admin</span>
        )}
        
        {!isAuthenticated ? (
          <Link to="/login" className="navbar-auth-btn" title="Sign In">
            <RiUser3Line size={16} />
            <span>Sign In</span>
          </Link>
        ) : (
          <button 
            className="navbar-menu-btn" 
            onClick={onToggleRightDrawer}
            title="Open services"
          >
            <RiMoreFill size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
