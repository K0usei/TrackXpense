/**
 * Utility function to get the API URL dynamically based on the current environment
 * This helps with accessing the API from different devices on the network
 */
export function getApiUrl(): string {
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // In browser context, use the current hostname
  if (typeof window !== 'undefined') {
    // Get the current hostname (IP address or domain)
    const hostname = window.location.hostname;

    // Use HTTPS for secure connection
    // We're using properly installed certificates now
    return `https://${hostname}:8000/api`;
  }

  // Fallback for server-side rendering
  return 'https://localhost:8000/api';
}

/**
 * Get the base URL for the backend API (without the /api suffix)
 */
export function getBackendBaseUrl(): string {
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }

  // In browser context, use the current hostname
  if (typeof window !== 'undefined') {
    // Get the current hostname (IP address or domain)
    const hostname = window.location.hostname;
    // Use HTTPS protocol for secure connection
    return `https://${hostname}:8000`;
  }

  // Fallback for server-side rendering
  return 'https://localhost:8000';
}
