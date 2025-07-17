import {
  createOptionsResponse,
  createCorsHeaders,
} from '../../lib/cors-helper.js';
import { getBaseUrl } from '../../lib/url-helper.js';
import oauthConfig from '../../lib/oauth-config.js';

const createErrorResponse = (
  error: string,
  description: string,
  status: number,
  request: Request
) => {
  return new Response(
    JSON.stringify({ error, error_description: description }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        ...createCorsHeaders(request),
      },
    }
  );
};

export async function POST(request: Request): Promise<Response> {
  try {
    const params = new URLSearchParams(await request.text());
    const grantType = params.get('grant_type');

    const docusignClientId = process.env.DOCUSIGN_INTEGRATION_KEY;
    const docusignClientSecret = process.env.DOCUSIGN_SECRET_KEY;

    if (!docusignClientId || !docusignClientSecret) {
      return createErrorResponse(
        'server_error',
        'DocuSign credentials not configured',
        500,
        request
      );
    }

    const docusignRedirectUri =
      process.env.DOCUSIGN_REDIRECT_URI || `${getBaseUrl()}/auth/callback`;
    const docusignAuthServer =
      process.env.DOCUSIGN_AUTH_SERVER || 'https://account-d.docusign.com';

    // Build parameters based on grant type
    const docusignParams = new URLSearchParams();

    if (grantType === 'authorization_code') {
      // Authorization code flow
      docusignParams.set('grant_type', 'authorization_code');
      docusignParams.set('code', params.get('code') || '');
      docusignParams.set('redirect_uri', docusignRedirectUri);
      docusignParams.set('code_verifier', params.get('code_verifier') || '');
    } else if (grantType === 'refresh_token') {
      // Refresh token flow
      docusignParams.set('grant_type', 'refresh_token');
      docusignParams.set('refresh_token', params.get('refresh_token') || '');
    } else {
      return createErrorResponse(
        'unsupported_grant_type',
        'Only authorization_code and refresh_token grant types are supported',
        400,
        request
      );
    }

    const response = await fetch(`${docusignAuthServer}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        Authorization: `Basic ${btoa(`${docusignClientId}:${docusignClientSecret}`)}`,
      },
      body: docusignParams.toString(),
    });

    const data = await response.json();

    // Ensure the scope field matches exactly what's in ai-plugin.json
    // ChatGPT validates this field against the manifest
    if (data.access_token) {
      // Override the scope to match our manifest exactly
      data.scope = oauthConfig.oauth_integration.scopes.default_scope;
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        ...createCorsHeaders(request),
      },
    });
  } catch (error) {
    // Log error for debugging
    return createErrorResponse(
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
