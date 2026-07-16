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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [roleFilter, setRoleFilter] = useState('all');
  const [timeRemaining, setTimeRemaining] = useState(null);

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

  useEffect(() => {
    let interval;
    if (isUnlocked) {
      const token = sessionStorage.getItem('admin_pin_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const expTime = payload.exp * 1000;
          
          const updateTimer = () => {
            const now = Date.now();
            const diff = expTime - now;
            if (diff <= 0) {
              setIsUnlocked(false);
              setTimeRemaining(null);
              sessionStorage.removeItem('admin_pin_token');
              fetchUsers();
            } else {
              const minutes = Math.floor(diff / 60000);
              const seconds = Math.floor((diff % 60000) / 1000);
              setTimeRemaining(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
            }
          };
          updateTimer();
          interval = setInterval(updateTimer, 1000);
        } catch (e) {
          console.error('Failed to parse token', e);
        }
      }
    }
    return () => clearInterval(interval);
  }, [isUnlocked, fetchUsers]);

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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedUsers = [...users]
    .filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (u.full_name && u.full_name.toLowerCase().includes(query)) || 
               (u.email && u.email.toLowerCase().includes(query));
      }
      return true;
    })
    .sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      if (aVal === '***') aVal = ''; 
      if (bVal === '***') bVal = ''; 
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

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
              <RiLockUnlockLine /> Unlocked ({timeRemaining ? `${timeRemaining} remaining` : 'Expires soon'})
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

      <div className="admin-users-controls" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', flex: 1, background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
        />
        <select 
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
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
                <th onClick={() => handleSort('full_name')} style={{cursor: 'pointer'}}>Name {sortConfig.key === 'full_name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('email')} style={{cursor: 'pointer'}}>Email {sortConfig.key === 'email' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('role')} style={{cursor: 'pointer'}}>Role {sortConfig.key === 'role' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('profession')} style={{cursor: 'pointer'}}>Profession {sortConfig.key === 'profession' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('degree')} style={{cursor: 'pointer'}}>Degree {sortConfig.key === 'degree' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('level')} style={{cursor: 'pointer'}}>Level {sortConfig.key === 'level' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('created_at')} style={{cursor: 'pointer'}}>Joined {sortConfig.key === 'created_at' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              </tr>
            </thead>
            <tbody>
              {processedUsers.map((user) => (
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
                  <td className={!isUnlocked && user.degree === '***' ? 'masked-data' : ''}>
                    {user.degree || (isUnlocked ? '-' : '***')}
                  </td>
                  <td className={!isUnlocked && user.level === '***' ? 'masked-data' : ''}>
                    {user.level || (isUnlocked ? '-' : '***')}
                  </td>
                  <td>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {processedUsers.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
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
