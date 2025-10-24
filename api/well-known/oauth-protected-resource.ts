import {
  createJsonResponse,
  createOptionsResponse,
} from '../../lib/cors-helper.js';
import oauthConfig from '../../lib/oauth-config.js';

/**
 * Custom handler to generate the correct protected resource metadata
 *
 * WHY NOT USE protectedResourceHandler?
 * We experienced a critical issue where the MCP server expected the resource URL
 * to be "http://localhost:3000/" (with trailing slash) but the metadata was
 * returning "http://localhost:3000" (without trailing slash).
 *
 * This was related to VS Code issue: https://github.com/microsoft/vscode/issues/255255
 *
 * The built-in protectedResourceHandler doesn't provide enough control over:
 * 1. Resource URL formatting (trailing slash requirement)
 * 2. Authorization server endpoint configuration
 * 3. Vercel routing compatibility (serves oauth-protected-resource.ts, not .well-known files)
 *
 * NON-SPEC IMPLEMENTATION:
 * ⚠️  CUSTOM: Scopes are Docusign-specific, not generic MCP scopes
 * ⚠️  CUSTOM: Includes 'resource_documentation' field (not part of RFC9728 but useful)
 * ⚠️  PROXY: This represents a proxy to Docusign, not a native MCP resource server
 */

export async function GET(request: Request) {
  const { oauth_integration } = oauthConfig;

  const origin = new URL(request.url).origin;
  const metadata = {
    resource: `${origin}/mcp`,
    authorization_servers: [origin],
    scopes_supported: [
      ...oauth_integration.scopes.required,
      ...oauth_integration.scopes.optional,
    ],
    bearer_methods_supported: ['header'],
    resource_documentation: `${origin}/docs`,
  };

  return createJsonResponse(metadata, request);
}

export async function OPTIONS(request: Request) {
  return createOptionsResponse(request);
}
