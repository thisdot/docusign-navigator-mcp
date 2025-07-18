import {
  createOptionsResponse,
  createJsonResponse,
} from '../../lib/cors-helper.js';
import { randomUUID } from 'crypto';
import { getBaseUrl } from '../../lib/url-helper.js';

interface ClientRegistrationRequest {
  client_name?: string;
  client_uri?: string;
  logo_uri?: string;
  scope?: string;
  redirect_uris?: string[];
  token_endpoint_auth_method?: string;
  grant_types?: string[];
  response_types?: string[];
  software_id?: string;
  software_version?: string;
}

interface ClientRegistrationResponse {
  client_id: string;
  client_secret?: string;
  client_id_issued_at?: number;
  client_secret_expires_at?: number;
  redirect_uris?: string[];
  token_endpoint_auth_method: string;
  grant_types: string[];
  response_types: string[];
  client_name?: string;
  client_uri?: string;
  logo_uri?: string;
  scope?: string;
  software_id?: string;
  software_version?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          error: 'invalid_client_metadata',
          error_description: 'Content-Type must be application/json',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
          },
        }
      );
    }

    const clientRequest: ClientRegistrationRequest = await request.json();

    // Validate required fields and generate client credentials
    const clientId = `mcp_${randomUUID()}`;
    const clientSecret = `secret_${randomUUID()}`;
    const issuedAt = Math.floor(Date.now() / 1000);

    // Set defaults for MCP clients using environment-appropriate URLs
    const defaultRedirectUris = [`${getBaseUrl()}/auth/callback`];
    const defaultGrantTypes = ['authorization_code', 'refresh_token'];
    const defaultResponseTypes = ['code'];
    const defaultTokenEndpointAuthMethod = 'none'; // Public clients don't need client_secret

    // Build the registration response
    const registrationResponse: ClientRegistrationResponse = {
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: issuedAt,
      client_secret_expires_at: 0, // 0 means never expires
      redirect_uris: clientRequest.redirect_uris || defaultRedirectUris,
      token_endpoint_auth_method:
        clientRequest.token_endpoint_auth_method ||
        defaultTokenEndpointAuthMethod,
      grant_types: clientRequest.grant_types || defaultGrantTypes,
      response_types: clientRequest.response_types || defaultResponseTypes,
      scope:
        clientRequest.scope ||
        'signature impersonation adm_store_unified_repo_read models_read',
    };

    // Include optional metadata if provided
    if (clientRequest.client_name) {
      registrationResponse.client_name = clientRequest.client_name;
    }
    if (clientRequest.client_uri) {
      registrationResponse.client_uri = clientRequest.client_uri;
    }
    if (clientRequest.logo_uri) {
      registrationResponse.logo_uri = clientRequest.logo_uri;
    }
    if (clientRequest.software_id) {
      registrationResponse.software_id = clientRequest.software_id;
    }
    if (clientRequest.software_version) {
      registrationResponse.software_version = clientRequest.software_version;
    }

    // In a stateless MCP server, we generate credentials on-demand
    // The client will use these credentials immediately for the OAuth flow
    // No persistent storage is required for this proxy pattern

    return createJsonResponse(registrationResponse, request);
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'invalid_client_metadata',
        error_description: 'Invalid JSON in request body',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
        },
      }
    );
  }
}

export async function OPTIONS(request: Request): Promise<Response> {
  return createOptionsResponse(request);
}
