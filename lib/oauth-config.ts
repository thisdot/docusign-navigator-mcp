/**
 * Streamlined OAuth Configuration for DocuSign Navigator MCP Server
 * Replaces the bloated 226-line configuration with focused, practical settings
 */

// TypeScript interfaces for type safety
interface OAuthScopes {
  required: string[];
  optional: string[];
  default_scope: string;
}

interface AuthServer {
  base_url: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
}

interface SecuritySettings {
  state_expiration_ms: number;
}

interface EndpointPaths {
  mcp: string;
  authorize: string;
  token: string;
  callback: string;
  register: string;
}

interface OAuthProvider {
  auth_server: AuthServer;
  scopes: OAuthScopes;
}

interface OAuthConfig {
  oauth_integration: OAuthProvider;
  security: SecuritySettings;
  endpoints: EndpointPaths;
}

// Streamlined configuration - easy to switch providers
const oauthConfig: OAuthConfig = {
  // DocuSign OAuth provider configuration
  oauth_integration: {
    auth_server: {
      base_url: 'https://account-d.docusign.com',
      authorization_endpoint: '/oauth/auth',
      token_endpoint: '/oauth/token',
      jwks_uri: 'https://account-d.docusign.com/oauth/jwks',
    },
    scopes: {
      required: ['signature'],
      optional: ['impersonation', 'adm_store_unified_repo_read', 'models_read'],
      default_scope:
        'signature impersonation adm_store_unified_repo_read models_read',
    },
  },

  // Security configuration
  security: {
    state_expiration_ms: 10 * 60 * 1000, // 10 minutes
  },

  // MCP server endpoint paths
  endpoints: {
    mcp: '/mcp',
    authorize: '/authorize',
    token: '/token',
    callback: '/auth/callback',
    register: '/register',
  },
};

export default oauthConfig;
