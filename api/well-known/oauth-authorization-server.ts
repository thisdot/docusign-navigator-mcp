import oauthConfig from '../../lib/oauth-config.js';
import {
  createOptionsResponse,
  createJsonResponse,
} from '../../lib/cors-helper.js';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const { oauth_integration } = oauthConfig;

  const metadata = {
    issuer: origin,
    authorization_endpoint: `${origin}/authorize`,
    token_endpoint: `${origin}/token`,
    jwks_uri: oauth_integration.auth_server.jwks_uri,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: [
      ...oauth_integration.scopes.required,
      ...oauth_integration.scopes.optional,
    ],
    registration_endpoint: `${origin}/register`,
    resource: `${origin}/`,
  };

  return createJsonResponse(metadata, request);
}

export async function OPTIONS(request: Request) {
  return createOptionsResponse(request);
}
