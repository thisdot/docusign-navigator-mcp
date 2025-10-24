import {
  createOptionsResponse,
  createCorsHeaders,
} from '../../lib/cors-helper.js';
import {
  createOAuthErrorResponse,
  createTokenResponse,
  OAuthTokenResponse,
} from '../../lib/oauth-response-utils.js';
import { config } from '../../lib/config.js';
import oauthConfig from '../../lib/oauth-config.js';

/**
 * Creates error response with CORS headers
 */
function createTokenErrorResponse(
  error: string,
  description: string,
  status: number,
  request: Request
): Response {
  const response = createOAuthErrorResponse(error, description, status);

  // Add CORS headers to the existing response
  const corsHeaders = createCorsHeaders(request);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Builds Docusign token request parameters
 */
function buildTokenRequestParams(
  grantType: string,
  params: URLSearchParams
): URLSearchParams {
  const docusignParams = new URLSearchParams();

  if (grantType === 'authorization_code') {
    docusignParams.set('grant_type', 'authorization_code');
    docusignParams.set('code', params.get('code') || '');
    docusignParams.set('redirect_uri', config.docusign.redirectUri);
    docusignParams.set('code_verifier', params.get('code_verifier') || '');
  } else if (grantType === 'refresh_token') {
    docusignParams.set('grant_type', 'refresh_token');
    docusignParams.set('refresh_token', params.get('refresh_token') || '');
  }

  return docusignParams;
}

/**
 * Makes token request to Docusign
 */
async function requestDocuSignToken(
  docusignParams: URLSearchParams
): Promise<Response> {
  const authHeader = `Basic ${btoa(`${config.docusign.clientId}:${config.docusign.clientSecret}`)}`;

  return fetch(`${config.docusign.baseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Authorization: authHeader,
    },
    body: docusignParams.toString(),
  });
}

/**
 * Processes Docusign token response
 */
function processTokenResponse(
  data: Record<string, unknown>,
  request: Request
): Response {
  // Ensure the scope field matches exactly what's in ai-plugin.json
  // ChatGPT validates this field against the manifest
  if (data.access_token) {
    data.scope = oauthConfig.oauth_integration.scopes.default_scope;
  }

  const tokenResponse = createTokenResponse(
    data as unknown as OAuthTokenResponse
  );

  // Add CORS headers
  const corsHeaders = createCorsHeaders(request);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    tokenResponse.headers.set(key, value);
  });

  return tokenResponse;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const params = new URLSearchParams(await request.text());
    const grantType = params.get('grant_type');

    // Validate grant type
    if (
      !grantType ||
      !['authorization_code', 'refresh_token'].includes(grantType)
    ) {
      return createTokenErrorResponse(
        'unsupported_grant_type',
        'Only authorization_code and refresh_token grant types are supported',
        400,
        request
      );
    }

    // Build Docusign token request parameters
    const docusignParams = buildTokenRequestParams(grantType, params);

    // Make token request to Docusign
    const response = await requestDocuSignToken(docusignParams);
    const data = await response.json();

    // Process and return token response
    return processTokenResponse(data, request);
  } catch (error) {
    return createTokenErrorResponse(
      'server_error',
      'Internal server error processing token request',
      500,
      request
    );
  }
}

export async function OPTIONS(request: Request): Promise<Response> {
  return createOptionsResponse(request);
}
