import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { RiShieldUserLine, RiLockPasswordLine, RiLockUnlockLine, RiCloseLine } from 'react-icons/ri';
import './AdminUsers.css';

export default function AdminUsers() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const token = sessionStorage.getItem('admin_pin_token');
      const headers = token ? { 'X-Pin-Token': token } : {};
      
      const response = await apiClient.get('/admin/users', { headers });
      setUsers(response.data);
      
      // If we got real data (no *** in email), consider it unlocked
      const hasMaskedData = response.data.some(u => u.email && u.email.includes('***'));
      setIsUnlocked(!hasMaskedData && token !== null);
      
      // If token is invalid/expired, backend returns masked data, so clear token
      if (token && hasMaskedData) {
        sessionStorage.removeItem('admin_pin_token');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        fetchUsers();
      }
    }
  }, [isAdmin, isLoading, navigate, fetchUsers]);

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    setPinError('');
    setIsVerifying(true);
    
    try {
      const response = await apiClient.post('/admin/verify-pin', { pin });
      const { pin_token } = response.data;
      
      sessionStorage.setItem('admin_pin_token', pin_token);
      setShowPinModal(false);
      setPin('');
      
      // Re-fetch users with the new token
      await fetchUsers();
    } catch (error) {
      setPinError(error.response?.data?.detail || 'Invalid PIN');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRowClick = () => {
    if (!isUnlocked) {
      setShowPinModal(true);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
      </div>
    );
  }

  return (
    <div className="admin-users-container">
      <div className="admin-users-header">
        <div>
          <h1 className="admin-users-title">
            <RiShieldUserLine className="admin-header-icon" />
            Registered Users
          </h1>
          <p className="admin-users-desc">Manage and view details of all registered users.</p>
        </div>
        
        <div>
          {isUnlocked ? (
            <div className="unlocked-badge">
              <RiLockUnlockLine /> Unlocked (Expires in 10m)
            </div>
          ) : (
            <button 
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => setShowPinModal(true)}
            >
              <RiLockPasswordLine /> Unlock Details
            </button>
          )}
        </div>
      </div>

      <div className="admin-users-table-container">
        {loadingUsers ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading users...
          </div>
        ) : (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Profession</th>
                <th>Level</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} onClick={handleRowClick}>
                  <td>{user.full_name}</td>
                  <td className={!isUnlocked && user.email.includes('***') ? 'masked-data' : ''}>
                    {user.email}
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      background: user.role === 'admin' ? 'rgba(255, 171, 0, 0.1)' : 'rgba(0, 150, 255, 0.1)',
                      color: user.role === 'admin' ? '#ffab00' : '#0096ff',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td className={!isUnlocked && user.profession === '***' ? 'masked-data' : ''}>
                    {user.profession || (isUnlocked ? '-' : '***')}
                  </td>
                  <td className={!isUnlocked && user.level === '***' ? 'masked-data' : ''}>
                    {user.level || (isUnlocked ? '-' : '***')}
                  </td>
                  <td>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* PIN Verification Modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div 
            className="pin-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="pin-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <button 
                className="pin-modal-close" 
                onClick={() => {
                  setShowPinModal(false);
                  setPinError('');
                  setPin('');
                }}
              >
                <RiCloseLine size={24} />
              </button>
              
              <h3><RiLockPasswordLine /> Security Verification</h3>
              <p>Enter your super admin PIN to view full user details. The session will stay unlocked for 10 minutes.</p>
              
              <form onSubmit={handleVerifyPin}>
                <div className="pin-input-group">
                  <input
                    type="password"
                    placeholder="Enter Security PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    autoFocus
                  />
                  {pinError && <div className="pin-error">{pinError}</div>}
                </div>
                
                <button 
                  type="submit" 
                  className="pin-submit-btn"
                  disabled={isVerifying || !pin}
                >
                  {isVerifying ? 'Verifying...' : 'Unlock Data'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
