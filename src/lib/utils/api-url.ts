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
    // Use the same protocol as the current page
    const protocol = window.location.protocol;
    
    // Return the API URL with the backend port (8000)
    return `${protocol}//${hostname}:8000/api`;
  }

  // Fallback for server-side rendering
  return 'https://localhost:8000/api';
}
