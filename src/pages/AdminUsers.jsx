import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiShieldUserLine, RiLockPasswordLine, RiLockUnlockLine, RiCloseLine,
  RiUserAddLine, RiDeleteBin6Line, RiUserFollowLine
} from 'react-icons/ri';
import './AdminUsers.css';

export default function AdminUsers() {
  const { isSuperAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Search, Sort, Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [roleFilter, setRoleFilter] = useState('all');

  // User role/delete action state
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  // Modal to Create Admin/User directly
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'admin',
    profession: '',
    degree: '',
    level: ''
  });

  // Inactivity timeout configuration (reads VITE_ADMIN_UNLOCK_TIMEOUT_SECONDS or defaults to 600 seconds)
  const timeoutSeconds = parseInt(import.meta.env.VITE_ADMIN_UNLOCK_TIMEOUT_SECONDS || '600', 10);
  const inactivityTimerRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const token = sessionStorage.getItem('admin_pin_token');
      const headers = token ? { 'X-Pin-Token': token } : {};
      
      const response = await apiClient.get('/admin/users', { headers });
      const normalizedUsers = response.data.map(u => ({
        ...u,
        id: u.id || u._id
      }));
      setUsers(normalizedUsers);
      
      // If we got real data (no *** in email), consider it unlocked
      const hasMaskedData = normalizedUsers.some(u => u.email && u.email.includes('***'));
      setIsUnlocked(!hasMaskedData && token !== null);
      
      if (token && hasMaskedData) {
        sessionStorage.removeItem('admin_pin_token');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const handleLockDetails = useCallback(() => {
    sessionStorage.removeItem('admin_pin_token');
    setIsUnlocked(false);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    fetchUsers();
  }, [fetchUsers]);

  // Reset inactivity timer on cursor movement or keyboard activity
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (isUnlocked) {
      inactivityTimerRef.current = setTimeout(() => {
        handleLockDetails();
      }, timeoutSeconds * 1000);
    }
  }, [isUnlocked, timeoutSeconds, handleLockDetails]);

  useEffect(() => {
    if (isUnlocked) {
      resetInactivityTimer();
      const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
      const handleActivity = () => resetInactivityTimer();
      
      events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
      return () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        events.forEach(event => window.removeEventListener(event, handleActivity));
      };
    }
  }, [isUnlocked, resetInactivityTimer]);

  useEffect(() => {
    if (!isLoading) {
      if (!isSuperAdmin) {
        navigate('/', { replace: true });
      } else {
        fetchUsers();
      }
    }
  }, [isSuperAdmin, isLoading, navigate, fetchUsers]);

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
      
      await fetchUsers();
    } catch (error) {
      setPinError(error.response?.data?.detail || 'Invalid PIN');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change this account to standard ${newRole === 'admin' ? 'Admin' : 'User'}?`)) {
      return;
    }
    
    setUpdatingUserId(userId);
    try {
      const token = sessionStorage.getItem('admin_pin_token');
      const headers = token ? { 'X-Pin-Token': token } : {};
      
      await apiClient.put(`/admin/users/${userId}/role`, { role: newRole }, { headers });
      
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );
    } catch (error) {
      console.error('Failed to change user role:', error);
      alert(error.response?.data?.detail || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to permanently delete user (${userEmail})?`)) {
      return;
    }

    setDeletingUserId(userId);
    try {
      const token = sessionStorage.getItem('admin_pin_token');
      const headers = token ? { 'X-Pin-Token': token } : {};

      await apiClient.delete(`/admin/users/${userId}`, { headers });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.detail || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    try {
      const token = sessionStorage.getItem('admin_pin_token');
      const headers = token ? { 'X-Pin-Token': token } : {};

      await apiClient.post('/admin/users', createForm, { headers });
      setShowCreateModal(false);
      setCreateForm({
        full_name: '',
        email: '',
        password: '',
        role: 'admin',
        profession: '',
        degree: '',
        level: ''
      });
      await fetchUsers();
    } catch (error) {
      setCreateError(error.response?.data?.detail || 'Failed to create user');
    } finally {
      setCreateLoading(false);
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
            Registered Users & Admins
          </h1>
          <p className="admin-users-desc">Manage system authorities, assign admin roles, and remove accounts.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isUnlocked && (
            <button 
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowCreateModal(true)}
            >
              <RiUserAddLine /> Add Admin / User
            </button>
          )}

          {isUnlocked ? (
            <button 
              className="unlocked-badge clickable" 
              onClick={handleLockDetails}
              title="Click to lock details immediately"
              style={{ 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                background: 'rgba(16, 185, 129, 0.08)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--color-success)',
                fontWeight: 600
              }}
            >
              <RiLockUnlockLine /> Unlocked 🔒 Lock
            </button>
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
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', flex: 1, background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
        />
        <select 
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      <div className="admin-users-table-container">
        {loadingUsers ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading users list...
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
                {isUnlocked && <th>Actions</th>}
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
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      background: user.role === 'super_admin' ? 'rgba(239, 68, 68, 0.12)' : (user.role === 'admin' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)'),
                      color: user.role === 'super_admin' ? '#ef4444' : (user.role === 'admin' ? '#f59e0b' : '#3b82f6'),
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
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </td>
                  {isUnlocked && (
                    <td onClick={(e) => e.stopPropagation()}>
                      {user.role === 'super_admin' || user.email === 'rams.cb.0429@gmail.com' ? (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          Primary Super Admin
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className={`btn-${user.role === 'admin' ? 'secondary' : 'primary'}`}
                            style={{
                              padding: '4px 10px',
                              fontSize: '12px',
                              borderRadius: '6px',
                              height: 'auto',
                              minHeight: '28px',
                              lineHeight: 1
                            }}
                            disabled={updatingUserId === user.id}
                            onClick={() => handleToggleRole(user.id, user.role)}
                          >
                            {updatingUserId === user.id ? 'Updating...' : (user.role === 'admin' ? 'Remove Admin' : 'Make Admin')}
                          </button>

                          <button
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              cursor: 'pointer'
                            }}
                            disabled={deletingUserId === user.id}
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            title="Delete user account"
                          >
                            {deletingUserId === user.id ? 'Deleting...' : <RiDeleteBin6Line size={14} />}
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {processedUsers.length === 0 && (
                <tr>
                  <td colSpan={isUnlocked ? "8" : "7"} style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
                    No users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE NEW ADMIN / USER MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="pin-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="pin-modal-card glass"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '440px', width: '100%' }}
            >
              <div className="pin-modal-header">
                <h3>
                  <RiUserCheckLine /> Add New Authority / User
                </h3>
                <button className="pin-modal-close" onClick={() => setShowCreateModal(false)}>
                  <RiCloseLine size={20} />
                </button>
              </div>

              {createError && (
                <div style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: '12px', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                    placeholder="John Doe"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="user@example.com"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Password *</label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Authority Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="admin">Admin (System Authority)</option>
                    <option value="user">User (Normal User)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 1 }}
                    disabled={createLoading}
                  >
                    {createLoading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN Verification Modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div 
            className="pin-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPinModal(false)}
          >
            <motion.div 
              className="pin-modal-card glass"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pin-modal-header">
                <h3>
                  <RiLockPasswordLine /> Super Admin Authentication
                </h3>
                <button className="pin-modal-close" onClick={() => setShowPinModal(false)}>
                  <RiCloseLine size={20} />
                </button>
              </div>

              <p className="pin-modal-desc">
                Protected Data Layer: Enter your 4-digit Master Security PIN to view email addresses and admin authorities.
              </p>

              <form onSubmit={handleVerifyPin}>
                <div className="pin-input-group">
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter PIN..."
                    autoFocus
                  />
                </div>

                {pinError && <p className="pin-error-msg">{pinError}</p>}

                <div className="pin-modal-actions">
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setShowPinModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={isVerifying || !pin}
                  >
                    {isVerifying ? 'Verifying...' : 'Unlock Data'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
