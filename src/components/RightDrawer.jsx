import { useAuth } from '../context/AuthContext';
import {
  RiCloseLine, RiImageLine, RiVideoLine, RiMusic2Line,
  RiFileList2Line, RiMoneyDollarCircleLine, RiBookOpenLine,
  RiShieldCheckLine, RiLogoutBoxRLine, RiDeleteBin7Line
} from 'react-icons/ri';
import './RightDrawer.css';

export default function RightDrawer({ isOpen, onClose }) {
  const { logout, deleteAccount } = useAuth();

  const handleAction = (msg) => {
    alert(msg);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete your account? This action is permanent.')) {
      deleteAccount();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="right-drawer glass">
        <div className="drawer-header">
          <span className="drawer-title">Platform Services</span>
          <button className="btn-icon drawer-close" onClick={onClose} aria-label="Close menu">
            <RiCloseLine size={22} />
          </button>
        </div>

        <div className="drawer-content">
          <div className="drawer-section">
            <p className="drawer-section-label">AI Capabilities</p>
            
            <button 
              className="drawer-item" 
              onClick={() => handleAction('Image Generator model panel integration coming soon!')}
            >
              <RiImageLine size={18} />
              <span>Image Generator</span>
            </button>

            <button 
              className="drawer-item" 
              onClick={() => handleAction('Video Generator model panel integration coming soon!')}
            >
              <RiVideoLine size={18} />
              <span>Video Generator</span>
            </button>

            <button 
              className="drawer-item" 
              onClick={() => handleAction('Music Generator model panel integration coming soon!')}
            >
              <RiMusic2Line size={18} />
              <span>Music Generator</span>
            </button>
          </div>

          <div className="drawer-section">
            <p className="drawer-section-label">Resources</p>

            <button 
              className="drawer-item" 
              onClick={() => handleAction('Direct pipeline pricing and limits info details coming soon!')}
            >
              <RiMoneyDollarCircleLine size={18} />
              <span>Pricing</span>
            </button>

            <button 
              className="drawer-item" 
              onClick={() => handleAction('RAMS terminology glossary coming soon!')}
            >
              <RiBookOpenLine size={18} />
              <span>Glossary</span>
            </button>

            <button 
              className="drawer-item" 
              onClick={() => handleAction('Reference manuals and documentation coming soon!')}
            >
              <RiFileList2Line size={18} />
              <span>Documentation</span>
            </button>

            <button 
              className="drawer-item" 
              onClick={() => handleAction('Privacy settings panel coming soon!')}
            >
              <RiShieldCheckLine size={18} />
              <span>Privacy Choices</span>
            </button>
          </div>

          <div className="drawer-section account-actions">
            <p className="drawer-section-label">Account</p>

            <button className="drawer-item logout" onClick={logout}>
              <RiLogoutBoxRLine size={18} />
              <span>Logout</span>
            </button>

            <button className="drawer-item delete-acct" onClick={handleDelete}>
              <RiDeleteBin7Line size={18} />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
