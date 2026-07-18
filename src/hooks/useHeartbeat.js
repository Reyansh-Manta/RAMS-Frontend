import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient';

const HEARTBEAT_INTERVAL = 60000; // 60 seconds

/**
 * Sends a lightweight heartbeat to the backend every 60 seconds
 * while the browser tab is visible, so "Active Now" stats are accurate.
 * Pauses when the tab is hidden, and resumes with an immediate ping
 * when the tab becomes visible again.
 */
export default function useHeartbeat() {
  const { isAuthenticated } = useAuth();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const sendHeartbeat = async () => {
      try {
        await apiClient.post('/auth/heartbeat');
      } catch {
        // Silently ignore — token expired, offline, etc.
      }
    };

    const startHeartbeat = () => {
      if (intervalRef.current) return; // Already running
      sendHeartbeat(); // Immediate ping
      intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    };

    const stopHeartbeat = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startHeartbeat();
      } else {
        stopHeartbeat();
      }
    };

    // Start if tab is already visible
    if (document.visibilityState === 'visible') {
      startHeartbeat();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopHeartbeat();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);
}
