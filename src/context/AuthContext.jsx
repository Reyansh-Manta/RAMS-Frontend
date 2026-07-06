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

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        username_or_email: usernameOrEmail,
        password: password
      });
      return handleAuthSuccess(response.data);
    } catch (error) {
      console.error('Login failed:', error);
      const message = error.response?.data?.detail || 'Invalid username/email or password';
      return { success: false, error: message };
    }
  };

  const googleLogin = async (idToken) => {
    try {
      const response = await apiClient.post('/auth/google', {
        id_token: idToken
      });
      return handleAuthSuccess(response.data);
    } catch (error) {
      console.error('Google login failed:', error);
      const message = error.response?.data?.detail || 'Google sign-in failed';
      return { success: false, error: message };
    }
  };

  const signup = async (username, email, fullName, password) => {
    try {
      const response = await apiClient.post('/auth/signup', {
        username,
        email,
        full_name: fullName,
        password,
        role: 'user'
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Signup failed:', error);
      const message = error.response?.data?.detail || 'Signup failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.error('Error logging out from backend:', e);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('rams_access_token');
      localStorage.removeItem('rams_refresh_token');
      localStorage.removeItem('rams_user');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isAdmin, 
      isLoading, 
      login, 
      googleLogin, 
      signup, 
      logout 
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
