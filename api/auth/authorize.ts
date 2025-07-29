import oauthConfig from '../../lib/oauth-config.js';
import { createOptionsResponse } from '../../lib/cors-helper.js';
import {
  createOAuthErrorResponse,
  createOAuthRedirectResponse,
} from '../../lib/oauth-response-utils.js';
import { config } from '../../lib/config.js';

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

// Validation rules for OAuth parameters
const VALIDATION_RULES = {
  response_type: {
    required: true,
    allowedValues: ['code'],
    error: 'unsupported_response_type',
    description: 'Only authorization code flow is supported',
  },
  client_id: {
    required: true,
    error: 'invalid_request',
    description: 'client_id parameter is required',
  },
  redirect_uri: {
    required: true,
    error: 'invalid_request',
    description: 'redirect_uri parameter is required',
  },
  code_challenge: {
    required: true,
    error: 'invalid_request',
    description: 'code_challenge parameter is required',
  },
  code_challenge_method: {
    required: true,
    allowedValues: ['S256'],
    error: 'invalid_request',
    description: 'code_challenge_method must be S256',
  },
};

// Allowed redirect URI schemes
const ALLOWED_SCHEMES = [
  'https',
  'http',
  'vscode',
  'ms-vscode',
  'chrome-extension',
  'moz-extension',
];

// Dangerous schemes to block
const DANGEROUS_SCHEMES = ['javascript', 'data', 'vbscript', 'file'];

// Supported scopes lookup table
const SUPPORTED_SCOPES = new Set([
  ...oauthConfig.oauth_integration.scopes.required,
  ...oauthConfig.oauth_integration.scopes.optional,
]);

/**
 * Encodes MCP client information into state parameter
 */
function encodeStateParameter(mcpClientInfo: MCPClientInfo): string {
  return encodeURIComponent(btoa(JSON.stringify(mcpClientInfo)));
}

/**
 * Validates authorization request using rule-based validation
 */
function validateAuthorizationRequest(
  authRequest: AuthorizationRequest
): AuthorizationError | null {
  // Validate required parameters and allowed values
  for (const [param, rule] of Object.entries(VALIDATION_RULES)) {
    const value = authRequest[param as keyof AuthorizationRequest];

    if (rule.required && !value) {
      return {
        error: rule.error,
        error_description: rule.description,
      };
    }

    if (
      value &&
      'allowedValues' in rule &&
      rule.allowedValues &&
      !rule.allowedValues.includes(value as string)
    ) {
      return {
        error: rule.error,
        error_description: rule.description,
      };
    }
  }

  // Validate redirect URI
  const redirectUriError = validateRedirectUri(authRequest.redirect_uri);
  if (redirectUriError) return redirectUriError;

  // Validate scope if provided
  if (authRequest.scope) {
    const scopeError = validateScope(authRequest.scope);
    if (scopeError) return scopeError;
  }

  // Validate resource parameter if provided
  if (authRequest.resource) {
    const resourceError = validateResource(authRequest.resource);
    if (resourceError) return resourceError;
  }

  return null;
}

/**
 * Validates redirect URI with security checks
 */
function validateRedirectUri(redirectUri: string): AuthorizationError | null {
  try {
    const url = new URL(redirectUri);
    const scheme = url.protocol.replace(':', '');

    // Block dangerous schemes
    if (DANGEROUS_SCHEMES.includes(scheme)) {
      return {
        error: 'invalid_request',
        error_description: 'redirect_uri is not allowed',
      };
    }

    // For localhost/dev: allow http only for localhost
    if (
      scheme === 'http' &&
      !['localhost', '127.0.0.1', '::1'].includes(url.hostname)
    ) {
      return {
        error: 'invalid_request',
        error_description: 'redirect_uri is not allowed',
      };
    }

    // Check allowed schemes
    if (!ALLOWED_SCHEMES.includes(scheme)) {
      return {
        error: 'invalid_request',
        error_description: 'redirect_uri is not allowed',
      };
    }

    return null;
  } catch {
    return {
      error: 'invalid_request',
      error_description: 'redirect_uri is not allowed',
    };
  }
}

/**
 * Validates scope parameter using lookup table
 */
function validateScope(scope: string): AuthorizationError | null {
  const normalizedScope = scope.replace(/\+/g, ' ');
  const requestedScopes = normalizedScope.split(' ');

  const invalidScopes = requestedScopes.filter(
    scope => scope && !SUPPORTED_SCOPES.has(scope)
  );

  if (invalidScopes.length > 0) {
    return {
      error: 'invalid_scope',
      error_description: `Unsupported scope(s): ${invalidScopes.join(', ')}`,
    };
  }

  return null;
}

/**
 * Validates resource parameter
 */
function validateResource(resource: string): AuthorizationError | null {
  try {
    new URL(resource);
    return null;
  } catch {
    return {
      error: 'invalid_request',
      error_description: 'resource parameter must be a valid URI',
    };
  }
}

/**
 * Handles authorization errors with proper redirect logic
 */
function handleAuthorizationError(
  error: AuthorizationError,
  redirectUri?: string
): Response {
  // Per RFC 6749, redirect to redirect_uri if it's valid and error is safe to redirect
  const safeToRedirect =
    redirectUri &&
    !validateRedirectUri(redirectUri) &&
    !['invalid_request', 'unauthorized_client'].includes(error.error);

  if (safeToRedirect) {
    const params: Record<string, string> = { error: error.error };
    if (error.error_description)
      params.error_description = error.error_description;
    if (error.error_uri) params.error_uri = error.error_uri;
    if (error.state) params.state = error.state;

    return createOAuthRedirectResponse(redirectUri, params);
  }

  // Return JSON error response
  return createOAuthErrorResponse(
    error.error,
    error.error_description,
    400,
    error.state
  );
}

/**
 * Builds DocuSign authorization URL
 */
function buildDocuSignAuthUrl(
  authRequest: AuthorizationRequest,
  encodedState: string
): string {
  const docusignAuthServer = config.docusign.baseUrl;
  const docusignAuthUrl = new URL(
    `${docusignAuthServer}${oauthConfig.oauth_integration.auth_server.authorization_endpoint}`
  );

  // Set required parameters
  docusignAuthUrl.searchParams.set('response_type', 'code');
  docusignAuthUrl.searchParams.set('client_id', config.docusign.clientId);
  docusignAuthUrl.searchParams.set('redirect_uri', config.docusign.redirectUri);
  docusignAuthUrl.searchParams.set('state', encodedState);

  // Set scope (use requested or default)
  const scope =
    authRequest.scope || oauthConfig.oauth_integration.scopes.default_scope;
  docusignAuthUrl.searchParams.set('scope', scope.replace(/\+/g, ' '));

  // Set PKCE parameters
  docusignAuthUrl.searchParams.set(
    'code_challenge',
    authRequest.code_challenge
  );
  docusignAuthUrl.searchParams.set(
    'code_challenge_method',
    authRequest.code_challenge_method
  );

  return docusignAuthUrl.toString();
}

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

    const encodedState = encodeStateParameter(mcpClientInfo);
    const docusignAuthUrl = buildDocuSignAuthUrl(authRequest, encodedState);

    // Redirect to DocuSign for authorization
    return createOAuthRedirectResponse(docusignAuthUrl);
  } catch (error) {
    // Log error internally but don't expose details to client
    return createOAuthErrorResponse(
      'server_error',
      'Internal server error processing authorization request',
      500
    );
  }
}

export async function OPTIONS(request: Request): Promise<Response> {
  return createOptionsResponse(request);
}
