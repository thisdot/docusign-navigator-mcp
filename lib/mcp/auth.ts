import { validateDocuSignToken } from '../docusign-service.js';
import { logger } from '../logger.js';
import type { AuthInfo } from './types.js';

// Token validation with Docusign - validates tokens proactively
export const createTokenVerifier =
  () =>
  async (req: Request, bearerToken?: string): Promise<AuthInfo | undefined> => {
    if (!bearerToken) {
      return undefined;
    }

    try {
      // Validate token with Docusign before processing requests
      const validation = await validateDocuSignToken(bearerToken);

      if (!validation.isValid) {
        logger.warn('Token validation failed', {
          error: validation.error,
          context: 'mcp_auth',
        });
        return undefined; // This will trigger 401 response
      }

      return {
        token: bearerToken,
        scopes: ['signature'], // Default scope
        clientId: 'unknown',
        extra: {
          userInfo: validation.userInfo,
          validatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Token validation error', error as Error, {
        context: 'mcp_auth',
      });
      return undefined; // This will trigger 401 response
    }
  };
