import oauthConfig from '../../lib/oauth-config.js';
import { createOptionsResponse } from '../../lib/cors-helper.js';
import { getBaseUrl } from '../../lib/url-helper.js';

interface AuthorizationRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
  code_challenge: string;
  code_challenge_method: string;
  resource?: string;
}

interface MCPClientInfo {
  client_id: string;
  redirect_uri: string;
  original_state?: string;
  code_challenge: string;
  code_challenge_method: string;
  resource?: string;
  timestamp: number;
}

interface AuthorizationError {
  error: string;
  error_description?: string;
  error_uri?: string;
  state?: string;
}

// Removed restrictive redirect URI patterns to be more permissive for growth

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    // Extract OAuth parameters
    const authRequest: AuthorizationRequest = {
      response_type: params.get('response_type') || '',
      client_id: params.get('client_id') || '',
      redirect_uri: params.get('redirect_uri') || '',
      scope: params.get('scope') || undefined,
      state: params.get('state') || undefined,
      code_challenge: params.get('code_challenge') || '',
      code_challenge_method: params.get('code_challenge_method') || '',
      resource: params.get('resource') || undefined,
    };

    // Validate the authorization request
    const validationError = validateAuthorizationRequest(authRequest);
    if (validationError) {
      return handleAuthorizationError(
        validationError,
        authRequest.redirect_uri
      );
    }

    // Encode MCP client information in state parameter
    const mcpClientInfo: MCPClientInfo = {
      client_id: authRequest.client_id,
      redirect_uri: authRequest.redirect_uri,
      original_state: authRequest.state,
      code_challenge: authRequest.code_challenge,
      code_challenge_method: authRequest.code_challenge_method,
      resource: authRequest.resource,
      timestamp: Date.now(),
    };

    const encodedState = encodeURIComponent(
      btoa(JSON.stringify(mcpClientInfo))
    );

    // Use DocuSign's integration key as the client_id for DocuSign
    const docusignClientId = process.env.DOCUSIGN_INTEGRATION_KEY;
    if (!docusignClientId) {
      throw new Error(
        'DOCUSIGN_INTEGRATION_KEY environment variable is required'
      );
    }

    // Get DocuSign auth server URL from environment or config
    const docusignAuthServer =
      process.env.DOCUSIGN_AUTH_SERVER ||
      oauthConfig.oauth_integration.auth_server.base_url;

    // Build DocuSign authorization URL
    const docusignAuthUrl = new URL(
      `${docusignAuthServer}${oauthConfig.oauth_integration.auth_server.authorization_endpoint}`
    );

    docusignAuthUrl.searchParams.set('response_type', 'code');
    docusignAuthUrl.searchParams.set('client_id', docusignClientId);
    // Use the configured redirect URI from environment or construct it
    const redirectUri =
      process.env.DOCUSIGN_REDIRECT_URI || `${getBaseUrl()}/auth/callback`;
    docusignAuthUrl.searchParams.set('redirect_uri', redirectUri);
    docusignAuthUrl.searchParams.set('state', encodedState);

    // Use the requested scope or default DocuSign scopes
    let scope =
      authRequest.scope || oauthConfig.oauth_integration.scopes.default_scope;
    // Normalize scope format for DocuSign (replace + with spaces)
    scope = scope.replace(/\+/g, ' ');
    docusignAuthUrl.searchParams.set('scope', scope);

    // Add PKCE parameters (we'll use our own PKCE challenge for DocuSign)
    docusignAuthUrl.searchParams.set(
      'code_challenge',
      authRequest.code_challenge
    );
    docusignAuthUrl.searchParams.set(
      'code_challenge_method',
      authRequest.code_challenge_method
    );

    // Redirect to DocuSign for authorization
    return new Response(null, {
      status: 302,
      headers: {
        Location: docusignAuthUrl.toString(),
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      },
    });
  } catch (error) {
    // Log error internally but don't expose details to client
    return new Response(
      JSON.stringify({
        error: 'server_error',
        error_description:
          'Internal server error processing authorization request',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          Pragma: 'no-cache',
        },
      }
    );
  }
}

function validateAuthorizationRequest(
  authRequest: AuthorizationRequest
): AuthorizationError | null {
  // Validate response_type
  if (authRequest.response_type !== 'code') {
    return {
      error: 'unsupported_response_type',
      error_description: 'Only authorization code flow is supported',
    };
  }

  // Validate client_id
  if (!authRequest.client_id) {
    return {
      error: 'invalid_request',
      error_description: 'client_id parameter is required',
    };
  }

  // Validate redirect_uri
  if (!authRequest.redirect_uri) {
    return {
      error: 'invalid_request',
      error_description: 'redirect_uri parameter is required',
    };
  }

  if (!isValidRedirectUri(authRequest.redirect_uri)) {
    return {
      error: 'invalid_request',
      error_description: 'redirect_uri is not allowed',
    };
  }

  // Validate PKCE parameters (OAuth 2.1 requires PKCE)
  if (!authRequest.code_challenge) {
    return {
      error: 'invalid_request',
      error_description: 'code_challenge parameter is required',
    };
  }

  if (authRequest.code_challenge_method !== 'S256') {
    return {
      error: 'invalid_request',
      error_description: 'code_challenge_method must be S256',
    };
  }

  // Validate scope if provided
  if (authRequest.scope) {
    // Handle URL-encoded spaces (+ signs) in scope parameter
    const normalizedScope = authRequest.scope.replace(/\+/g, ' ');
    const requestedScopes = normalizedScope.split(' ');
    const supportedScopes = [
      ...oauthConfig.oauth_integration.scopes.required,
      ...oauthConfig.oauth_integration.scopes.optional,
    ];

    const invalidScopes = requestedScopes.filter(
      scope => scope && !supportedScopes.includes(scope)
    );

    if (invalidScopes.length > 0) {
      return {
        error: 'invalid_scope',
        error_description: `Unsupported scope(s): ${invalidScopes.join(', ')}`,
      };
    }
  }

  // Validate resource parameter if provided
  if (authRequest.resource) {
    try {
      new URL(authRequest.resource);
    } catch {
      return {
        error: 'invalid_request',
        error_description: 'resource parameter must be a valid URI',
      };
    }
  }

  return null;
}

function isValidRedirectUri(redirectUri: string): boolean {
  try {
    const url = new URL(redirectUri);

    // Security: Block dangerous schemes
    const dangerousSchemes = ['javascript', 'data', 'vbscript', 'file'];
    if (dangerousSchemes.includes(url.protocol.replace(':', ''))) {
      return false;
    }

    // Allow common OAuth redirect patterns
    const allowedSchemes = [
      'https',
      'http',
      'vscode',
      'ms-vscode',
      'chrome-extension',
      'moz-extension',
    ];
    const scheme = url.protocol.replace(':', '');

    // For localhost/dev: allow http only for localhost
    if (
      scheme === 'http' &&
      !['localhost', '127.0.0.1', '::1'].includes(url.hostname)
    ) {
      return false;
    }

    return allowedSchemes.includes(scheme);
  } catch {
    return false;
  }
}

function handleAuthorizationError(
  error: AuthorizationError,
  redirectUri?: string
): Response {
  // Per RFC 6749, we should redirect to redirect_uri if it's valid and the error is safe to redirect
  // Otherwise, return JSON error response
  const safeToRedirect =
    redirectUri &&
    isValidRedirectUri(redirectUri) &&
    !['invalid_request', 'unauthorized_client'].includes(error.error);

  if (safeToRedirect) {
    const errorUrl = new URL(redirectUri);
    errorUrl.searchParams.set('error', error.error);

    if (error.error_description) {
      errorUrl.searchParams.set('error_description', error.error_description);
    }

    if (error.error_uri) {
      errorUrl.searchParams.set('error_uri', error.error_uri);
    }

    if (error.state) {
      errorUrl.searchParams.set('state', error.state);
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: errorUrl.toString(),
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      },
    });
  }

  // Return JSON error response
  return new Response(JSON.stringify(error), {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  });
}

export async function OPTIONS(request: Request): Promise<Response> {
  return createOptionsResponse(request);
}
