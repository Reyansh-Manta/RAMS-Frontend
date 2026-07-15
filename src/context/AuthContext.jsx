import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('rams_user');
    const token = localStorage.getItem('rams_access_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = (data) => {
    const { access_token, refresh_token } = data;
    localStorage.setItem('rams_access_token', access_token);
    localStorage.setItem('rams_refresh_token', refresh_token);
    
    // Parse JWT to extract user information
    try {
      const payloadBase64 = access_token.split('.')[1];
      const payloadDecoded = JSON.parse(atob(payloadBase64));
      
      // Fetch user profile or mock user payload
      const userProfile = {
        id: payloadDecoded.sub,
        role: payloadDecoded.role || 'user',
        username: payloadDecoded.sub // Use sub as username fallback
      };
      
      setUser(userProfile);
      setIsAuthenticated(true);
      localStorage.setItem('rams_user', JSON.stringify(userProfile));
      return { success: true };
    } catch (e) {
      console.error('Error decoding JWT:', e);
      return { success: false, error: 'Auth failed' };
    }
  };

  const googleLogin = async (idToken) => {
    try {
      const response = await apiClient.post('/auth/google', {
        id_token: idToken
      });
      if (response.data.registered === false) {
        return { success: true, registered: false, data: response.data };
      }
      return handleAuthSuccess(response.data);
    } catch (error) {
      console.error('Google login failed:', error);
      const message = error.response?.data?.detail || 'Google sign-in failed';
      return { success: false, error: message };
    }
  };

  const googleRegister = async (registrationData) => {
    try {
      const response = await apiClient.post('/auth/register', registrationData);
      return handleAuthSuccess(response.data);
    } catch (error) {
      console.error('Google register failed:', error);
      const message = error.response?.data?.detail || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout', {}, { timeout: 2000 });
    } catch (e) {
      console.error('Error logging out from backend:', e);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('rams_access_token');
      localStorage.removeItem('rams_refresh_token');
      localStorage.removeItem('rams_user');
      window.location.href = '/login';
    }
  };

  const deleteAccount = async () => {
    try {
      await apiClient.delete('/auth/account', { timeout: 2000 });
    } catch (e) {
      console.error('Error deleting account:', e);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('rams_access_token');
      localStorage.removeItem('rams_refresh_token');
      localStorage.removeItem('rams_user');
      window.location.href = '/login';
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isAdmin, 
      isLoading, 
      googleLogin, 
      googleRegister,
      logout,
      deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
