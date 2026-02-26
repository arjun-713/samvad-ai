/**
 * API service for communicating with Samvad AI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
}

interface StatusResponse {
  backend: string;
  aws_configured: boolean;
  services: {
    transcribe: string;
    polly: string;
    bedrock: string;
  };
}

interface ApiResponse {
  message: string;
  version: string;
  status: string;
}

/**
 * Fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
  return fetchAPI<HealthCheckResponse>('/api/health');
}

/**
 * Get system status
 */
export async function getStatus(): Promise<StatusResponse> {
  return fetchAPI<StatusResponse>('/api/status');
}

/**
 * Get API root information
 */
export async function getApiInfo(): Promise<ApiResponse> {
  return fetchAPI<ApiResponse>('/');
}

/**
 * Test backend connectivity
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await checkHealth();
    return response.status === 'Samvad Backend is alive';
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

export default {
  checkHealth,
  getStatus,
  getApiInfo,
  testConnection,
};
