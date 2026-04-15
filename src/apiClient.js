import axios from 'axios';

/**
 * Axios instance configured to automatically use our proxies!
 * 
 * We set the baseURL to an empty string here, which means all requests 
 * implicitly go to the current domain. In both Dev and Prod, any request 
 * starting with '/api' is caught by our proxy and forwarded to Render.
 */
export const apiClient = axios.create({
  baseURL: '', // The baseURL is empty so it just appends to the current host
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
