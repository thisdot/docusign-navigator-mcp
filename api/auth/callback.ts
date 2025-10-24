import { createOptionsResponse } from '../../lib/cors-helper.js';
import {
  createOAuthErrorResponse,
  createOAuthRedirectResponse,
} from '../../lib/oauth-response-utils.js';
import { config } from '../../lib/config.js';

interface MCPClientInfo {
  client_id: string;
  redirect_uri: string;
  original_state?: string;
  code_challenge: string;
  code_challenge_method: string;
  resource?: string;
  timestamp: number;
}

/**
 * Decodes and validates state parameter
 */
function decodeStateParameter(state: string): MCPClientInfo | null {
  try {
    return JSON.parse(atob(decodeURIComponent(state))) as MCPClientInfo;
  } catch {
    return null;
  }
}

/**
 * Validates state timestamp to prevent replay attacks
 */
function validateStateTimestamp(mcpClientInfo: MCPClientInfo): boolean {
  return (
    Date.now() - mcpClientInfo.timestamp <= config.security.stateExpirationMs
  );
}

/**
 * Handles Docusign error responses by redirecting to original client
 */
function handleDocuSignError(
  error: string,
  errorDescription: string | null,
  state: string | null
): Response {
  if (!state) {
    return createOAuthErrorResponse(
      error,
      errorDescription || 'Authorization failed'
    );
  }

  const mcpClientInfo = decodeStateParameter(state);
  if (!mcpClientInfo) {
    return createOAuthErrorResponse(
      error,
      errorDescription || 'Authorization failed'
    );
  }

  // Build error redirect parameters
  const errorParams: Record<string, string> = { error };
  if (errorDescription) errorParams.error_description = errorDescription;
  if (mcpClientInfo.original_state)
    errorParams.state = mcpClientInfo.original_state;

  return createOAuthRedirectResponse(mcpClientInfo.redirect_uri, errorParams);
}

/**
 * Builds success redirect URL with authorization code
 */
function buildSuccessRedirect(
  code: string,
  mcpClientInfo: MCPClientInfo
): Response {
  const redirectParams: Record<string, string> = { code };

  // Include original state if it existed
  if (mcpClientInfo.original_state) {
    redirectParams.state = mcpClientInfo.original_state;
  }

  return createOAuthRedirectResponse(
    mcpClientInfo.redirect_uri,
    redirectParams
  );
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    // Handle error response from Docusign
    if (error) {
      return handleDocuSignError(error, errorDescription, state);
    }

    // Validate required parameters
    if (!code || !state) {
      return createOAuthErrorResponse(
        'invalid_request',
        'Missing required parameters (code or state)'
      );
    }

    // Decode the MCP client information from state
    const mcpClientInfo = decodeStateParameter(state);
    if (!mcpClientInfo) {
      return createOAuthErrorResponse(
        'invalid_request',
        'Invalid state parameter'
      );
    }

    // Validate timestamp (prevent replay attacks)
    if (!validateStateTimestamp(mcpClientInfo)) {
      return createOAuthErrorResponse(
        'invalid_request',
        'State parameter has expired'
      );
    }

    // Build success redirect back to MCP client
    return buildSuccessRedirect(code, mcpClientInfo);
  } catch (error) {
    return createOAuthErrorResponse(
      'server_error',
      'Internal server error processing callback',
      500
    );
  }
}

export async function OPTIONS(request: Request): Promise<Response> {
  return createOptionsResponse(request);
}
