/**
 * OAuth Response Utilities
 * Standardizes OAuth error responses, redirects, and token responses
 */

// OAuth error response interface
export interface OAuthErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
  state?: string;
}

// OAuth token response interface
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

// Standard OAuth response headers
const OAUTH_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
} as const;

/**
 * Creates a standardized OAuth error response
 * @param error - OAuth error code (e.g., 'invalid_request', 'access_denied')
 * @param description - Human-readable error description
 * @param statusCode - HTTP status code (default: 400)
 * @param state - Optional state parameter to include in response
 * @returns Response object with standardized OAuth error format
 */
export function createOAuthErrorResponse(
  error: string,
  description?: string,
  statusCode: number = 400,
  state?: string
): Response {
  const errorResponse: OAuthErrorResponse = {
    error,
    ...(description && { error_description: description }),
    ...(state && { state }),
  };

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: OAUTH_HEADERS,
  });
}

/**
 * Creates a standardized OAuth redirect response
 * @param redirectUri - The URI to redirect to
 * @param params - Query parameters to include in the redirect
 * @returns Response object with 302 redirect
 */
export function createOAuthRedirectResponse(
  redirectUri: string,
  params: Record<string, string> = {}
): Response {
  const url = new URL(redirectUri);

  // Add parameters to the redirect URL
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  });
}

/**
 * Creates a standardized OAuth token response
 * @param tokenData - Token response data
 * @returns Response object with token data
 */
export function createTokenResponse(tokenData: OAuthTokenResponse): Response {
  return new Response(JSON.stringify(tokenData), {
    status: 200,
    headers: OAUTH_HEADERS,
  });
}
