// ==========================================
// Docusign Authentication & API Service
// ==========================================

import { logger } from './logger.js';
import { config } from './config.js';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ==========================================
// Docusign User Info Utility
// ==========================================

/**
 * Fetches user info and extracts account ID
 * Shared utility to eliminate duplicate user info fetching
 */
async function fetchUserAccountId(accessToken: string): Promise<string> {
  const userInfoRes = await fetch(`${config.docusign.baseUrl}/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userInfoRes.ok) {
    const errorText = await userInfoRes.text();

    if (userInfoRes.status === 401) {
      // Try to parse the error for more details
      let errorMessage = 'Invalid access token';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error === 'internal_server_error') {
          errorMessage =
            'Access token has expired or is invalid. Please re-authenticate with Docusign.';
        } else if (errorData.error) {
          errorMessage = `Authentication failed: ${errorData.error}`;
        }
      } catch {
        // Use default message if parsing fails
      }
      throw new AppError(errorMessage, 401);
    }

    throw new AppError(
      'Failed to retrieve user information',
      userInfoRes.status
    );
  }

  const userInfo = await userInfoRes.json();

  if (
    !userInfo.accounts ||
    !Array.isArray(userInfo.accounts) ||
    userInfo.accounts.length === 0
  ) {
    throw new AppError('No Docusign accounts found for user', 404);
  }

  return userInfo.accounts[0].account_id;
}

// ==========================================
// Generic Docusign API Request Wrapper
// ==========================================

/**
 * Generic wrapper for Docusign Navigator API requests
 * Consolidates common patterns and error handling
 */
async function makeDocuSignAPIRequest(
  url: string,
  accessToken: string,
  apiName: string,
  additionalContext?: Record<string, unknown>
): Promise<any> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    // Try to get the response body for more details
    let errorDetails = '';
    try {
      const errorBody = await response.text();
      errorDetails = errorBody;
    } catch {
      // Ignore error reading response body
    }

    // Log meaningful API errors for debugging
    if (response.status >= 500) {
      logger.error(
        'Docusign Navigator API error',
        {
          message: errorDetails || 'Unknown server error',
        },
        {
          status: response.status,
          api: apiName,
          ...additionalContext,
        }
      );
    }

    // Handle common error cases
    if (response.status === 401) {
      throw new AppError('Invalid access token', 401);
    }
    if (response.status === 403) {
      throw new AppError(
        'Access denied - Docusign Navigator may not be enabled for this account. To get access, please visit: https://developers.docusign.com/docs/navigator-api/',
        403
      );
    }
    if (response.status === 404) {
      // Check if this is a Navigator API not found error vs resource not found
      if (
        errorDetails.includes('Navigator') ||
        errorDetails.includes('not available')
      ) {
        throw new AppError(
          'Docusign Navigator API not found - may not be available for this account. To get access, please visit: https://developers.docusign.com/docs/navigator-api/',
          404
        );
      } else {
        throw new AppError(
          apiName === 'agreement_by_id'
            ? 'Agreement not found'
            : 'Resource not found',
          404
        );
      }
    }

    throw new AppError(
      `Failed to retrieve ${apiName} (${response.status}): ${errorDetails}`,
      response.status
    );
  }

  return response.json();
}

// ==========================================
// Docusign Authentication
// ==========================================

export async function exchangeCodeForToken(
  code: string,
  codeVerifier?: string,
  redirectUri?: string
) {
  if (!code || typeof code !== 'string') {
    throw new AppError('Invalid authorization code', 400);
  }

  const url = `${config.docusign.baseUrl}/oauth/token`;
  const auth = Buffer.from(
    `${config.docusign.clientId}:${config.docusign.clientSecret}`
  ).toString('base64');

  try {
    // Build token request parameters
    const tokenParams: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri || config.docusign.redirectUri,
    };

    // Add PKCE code_verifier if provided (required for desktop OAuth)
    if (codeVerifier) {
      tokenParams.code_verifier = codeVerifier;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenParams),
    });

    if (!res.ok) {
      const errorText = await res.text();
      logger.error(
        'Docusign token exchange failed',
        {
          message: errorText || 'Unknown error',
        },
        {
          status: res.status,
          context: 'oauth_token_exchange',
        }
      );
      throw new AppError('Authentication failed', 401);
    }

    return res.json();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Token exchange failed', error as Error, {
      context: 'oauth_token_exchange',
    });
    throw new AppError('Authentication service unavailable', 503);
  }
}

// ==========================================
// Docusign User Validation
// ==========================================

export async function validateDocuSignToken(accessToken: string): Promise<{
  isValid: boolean;
  userInfo?: any;
  error?: string;
}> {
  if (!accessToken || typeof accessToken !== 'string') {
    return { isValid: false, error: 'Invalid access token' };
  }

  try {
    const userInfoRes = await fetch(
      `${config.docusign.baseUrl}/oauth/userinfo`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!userInfoRes.ok) {
      const errorText = await userInfoRes.text();

      // Only log meaningful authentication failures
      if (userInfoRes.status === 401) {
        logger.warn('Docusign token expired or invalid', {
          status: userInfoRes.status,
          context: 'token_validation',
        });
        return {
          isValid: false,
          error: 'Access token has expired or is invalid',
        };
      }

      logger.error(
        'Docusign userinfo request failed',
        {
          message: errorText || 'Unknown error',
        },
        {
          status: userInfoRes.status,
          context: 'token_validation',
        }
      );

      return {
        isValid: false,
        error: 'Failed to validate token with Docusign',
      };
    }

    const userInfo = await userInfoRes.json();
    return { isValid: true, userInfo };
  } catch (error) {
    logger.error('Token validation failed', error as Error, {
      context: 'docusign_auth',
    });
    return { isValid: false, error: 'Docusign service unavailable' };
  }
}

// ==========================================
// Docusign Navigator API Client
// ==========================================

export async function fetchAgreements(accessToken: string) {
  if (!accessToken || typeof accessToken !== 'string') {
    throw new AppError('Invalid access token', 401);
  }

  try {
    const accountId = await fetchUserAccountId(accessToken);

    // Fetch agreements from Navigator API - uses different base URL than eSignature API
    const url = `https://api-d.docusign.com/v1/accounts/${accountId}/agreements`;

    return await makeDocuSignAPIRequest(url, accessToken, 'agreements');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Agreements fetch failed', error as Error, {
      api: 'agreements',
    });
    throw new AppError('Docusign Navigator service unavailable', 503);
  }
}

export async function fetchAgreementById(
  accessToken: string,
  agreementId: string
) {
  if (!accessToken || typeof accessToken !== 'string') {
    throw new AppError('Invalid access token', 401);
  }

  if (!agreementId || typeof agreementId !== 'string') {
    throw new AppError('Invalid agreement ID', 400);
  }

  try {
    const accountId = await fetchUserAccountId(accessToken);

    // Fetch specific agreement from Navigator API - uses different base URL than eSignature API
    const url = `https://api-d.docusign.com/v1/accounts/${accountId}/agreements/${agreementId}`;

    return await makeDocuSignAPIRequest(url, accessToken, 'agreement_by_id', {
      agreementId,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Agreement fetch failed', error as Error, {
      api: 'agreement_by_id',
      agreementId,
    });
    throw new AppError('Docusign Navigator service unavailable', 503);
  }
}
