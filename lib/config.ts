/**
 * Centralized Configuration
 * Consolidates environment variables and configuration settings
 * with type-safe access and validation
 */

// Configuration interface
export interface AppConfig {
  docusign: {
    clientId: string;
    clientSecret: string;
    baseUrl: string;
    redirectUri: string;
  };
  server: {
    baseUrl: string;
    port: number;
  };
  security: {
    stateExpirationMs: number;
  };
  logging: {
    level: string;
  };
}

/**
 * Gets environment variable with optional default value
 * @param key - Environment variable key
 * @param defaultValue - Default value if not found
 * @returns Environment variable value or default
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value || defaultValue!;
}

/**
 * Centralized application configuration
 * Loads and validates all configuration from environment variables
 */
export const config: AppConfig = {
  docusign: {
    clientId: getEnvVar('DOCUSIGN_INTEGRATION_KEY'),
    clientSecret: getEnvVar('DOCUSIGN_SECRET_KEY'),
    baseUrl: getEnvVar(
      'DOCUSIGN_AUTH_SERVER',
      'https://account-d.docusign.com'
    ),
    redirectUri: getEnvVar('DOCUSIGN_REDIRECT_URI'),
  },
  server: {
    baseUrl: getEnvVar('SERVER_BASE_URL', 'http://localhost:3000'),
    port: parseInt(getEnvVar('PORT', '3000'), 10),
  },
  security: {
    stateExpirationMs: parseInt(getEnvVar('STATE_EXPIRATION_MS', '600000'), 10), // 10 minutes
  },
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
  },
};

/**
 * Validates configuration on startup
 * @throws Error if configuration is invalid
 */
export function validateConfig(): void {
  // Validate required Docusign settings
  if (!config.docusign.clientId) {
    throw new Error('Docusign Client ID is required');
  }
  if (!config.docusign.clientSecret) {
    throw new Error('Docusign Client Secret is required');
  }
  if (!config.docusign.redirectUri) {
    throw new Error('Docusign Redirect URI is required');
  }

  // Validate numeric values
  if (isNaN(config.server.port) || config.server.port <= 0) {
    throw new Error('Server port must be a positive number');
  }
  if (
    isNaN(config.security.stateExpirationMs) ||
    config.security.stateExpirationMs <= 0
  ) {
    throw new Error('State expiration must be a positive number');
  }
}
