/**
 * Simple URL Helper for Vercel Deployment
 *
 * Provides consistent base URL construction across all API routes.
 */

/**
 * Gets the base URL for the application
 *
 * Priority order:
 * 1. VERCEL_URL (automatically set by Vercel) - always HTTPS in production
 * 2. BASE_URL (manually configured for local development)
 * 3. Fallback to localhost:3000 for development
 */
export function getBaseUrl(): string {
  // Vercel automatically sets VERCEL_URL for deployments
  if (process.env.VERCEL_URL) {
    // VERCEL_URL doesn't include protocol, always use HTTPS for Vercel
    return `https://${process.env.VERCEL_URL}`;
  }

  // Use BASE_URL if explicitly set (for local development overrides)
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  // Fallback for local development
  return 'http://localhost:3000';
}
