// API configuration utility
// This ensures all API calls use the correct backend URL

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const apiConfig = {
  baseURL: API_BASE_URL,
  apiURL: `${API_BASE_URL}/api`,
  timeout: 10000,
};

// Helper function to get full API endpoint URL
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${apiConfig.apiURL}/${cleanEndpoint}`;
};

// Axios instance configuration
export const axiosConfig = {
  baseURL: apiConfig.apiURL,
  timeout: apiConfig.timeout,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
};

export default apiConfig;
