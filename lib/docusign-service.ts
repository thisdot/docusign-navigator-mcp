// ==========================================
// DocuSign Authentication & API Service
// ==========================================

import { logger } from './logger.js';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Environment variables - these should be set in your environment
const DOCUSIGN_AUTH_SERVER =
  process.env.DOCUSIGN_AUTH_SERVER || 'https://account-d.docusign.com';
const DOCUSIGN_INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY;
const DOCUSIGN_REDIRECT_URI = process.env.DOCUSIGN_REDIRECT_URI;
const DOCUSIGN_SECRET_KEY = process.env.DOCUSIGN_SECRET_KEY;

// ==========================================
// DocuSign Authentication
// ==========================================

export async function exchangeCodeForToken(
  code: string,
  codeVerifier?: string,
  redirectUri?: string
) {
  if (!code || typeof code !== 'string') {
    throw new AppError('Invalid authorization code', 400);
  }

  const url = `${DOCUSIGN_AUTH_SERVER}/oauth/token`;
  const auth = Buffer.from(
    `${DOCUSIGN_INTEGRATION_KEY}:${DOCUSIGN_SECRET_KEY}`
  ).toString('base64');

  try {
    // Build token request parameters
    const tokenParams: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri || DOCUSIGN_REDIRECT_URI!,
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
        'DocuSign token exchange failed',
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
// DocuSign User Validation
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
      'https://account-d.docusign.com/oauth/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!userInfoRes.ok) {
      const errorText = await userInfoRes.text();

      // Only log meaningful authentication failures
      if (userInfoRes.status === 401) {
        logger.warn('DocuSign token expired or invalid', {
          status: userInfoRes.status,
          context: 'token_validation',
        });
        return {
          isValid: false,
          error: 'Access token has expired or is invalid',
        };
      }

      logger.error(
        'DocuSign userinfo request failed',
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
        error: 'Failed to validate token with DocuSign',
      };
    }

    const userInfo = await userInfoRes.json();
    // Remove verbose success logging - Vercel already tracks successful requests

    return { isValid: true, userInfo };
  } catch (error) {
    logger.error('Token validation failed', error as Error, {
      context: 'docusign_auth',
    });
    return { isValid: false, error: 'DocuSign service unavailable' };
  }
}

// ==========================================
// DocuSign Navigator API Client
// ==========================================

export async function fetchAgreements(accessToken: string) {
  if (!accessToken || typeof accessToken !== 'string') {
    throw new AppError('Invalid access token', 401);
  }

  try {
    const userInfoRes = await fetch(
      'https://account-d.docusign.com/oauth/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!userInfoRes.ok) {
      const errorText = await userInfoRes.text();

      if (userInfoRes.status === 401) {
        // Try to parse the error for more details
        let errorMessage = 'Invalid access token';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error === 'internal_server_error') {
            errorMessage =
              'Access token has expired or is invalid. Please re-authenticate with DocuSign.';
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
      throw new AppError('No DocuSign accounts found for user', 404);
    }

    const accountId = userInfo.accounts[0].account_id;

    // Fetch agreements from Navigator API - uses different base URL than eSignature API
    const url = `https://api-d.docusign.com/v1/accounts/${accountId}/agreements`;

    const agreementsRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!agreementsRes.ok) {
      // Try to get the response body for more details
      let errorDetails = '';
      try {
        const errorBody = await agreementsRes.text();
        errorDetails = errorBody;
      } catch {
        // Ignore error reading response body
      }

      // Log meaningful API errors for debugging
      if (agreementsRes.status >= 500) {
        logger.error(
          'DocuSign Navigator API error',
          {
            message: errorDetails || 'Unknown server error',
          },
          {
            status: agreementsRes.status,
            api: 'agreements',
          }
        );
      }

      if (agreementsRes.status === 401) {
        throw new AppError('Invalid access token', 401);
      }
      if (agreementsRes.status === 403) {
        throw new AppError(
          'Access denied - DocuSign Navigator may not be enabled for this account. To get access, please visit: https://developers.docusign.com/docs/navigator-api/',
          403
        );
      }
      if (agreementsRes.status === 404) {
        throw new AppError(
          'DocuSign Navigator API not found - may not be available for this account. To get access, please visit: https://developers.docusign.com/docs/navigator-api/',
          404
        );
      }
      throw new AppError(
        `Failed to retrieve agreements (${agreementsRes.status}): ${errorDetails}`,
        agreementsRes.status
      );
    }

    const agreementsData = await agreementsRes.json();

    return agreementsData;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Agreements fetch failed', error as Error, {
      api: 'agreements',
    });
    throw new AppError('DocuSign Navigator service unavailable', 503);
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
    const userInfoRes = await fetch(
      'https://account-d.docusign.com/oauth/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!userInfoRes.ok) {
      if (userInfoRes.status === 401) {
        throw new AppError('Invalid access token', 401);
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
      throw new AppError('No DocuSign accounts found for user', 404);
    }

    const accountId = userInfo.accounts[0].account_id;

    // Fetch specific agreement from Navigator API - uses different base URL than eSignature API
    const url = `https://api-d.docusign.com/v1/accounts/${accountId}/agreements/${agreementId}`;

    const agreementRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!agreementRes.ok) {
      // Try to get the response body for more details
      let errorDetails = '';
      try {
        const errorBody = await agreementRes.text();
        errorDetails = errorBody;
      } catch {
        // Ignore error reading response body
      }

      // Log meaningful API errors for debugging
      if (agreementRes.status >= 500) {
        logger.error(
          'DocuSign Navigator API error',
          {
            message: errorDetails || 'Unknown server error',
          },
          {
            status: agreementRes.status,
            api: 'agreement_by_id',
            agreementId,
          }
        );
      }

      if (agreementRes.status === 401) {
        throw new AppError('Invalid access token', 401);
      }
      if (agreementRes.status === 403) {
        throw new AppError(
          'Access denied - DocuSign Navigator may not be enabled for this account. To get access, please visit: https://developers.docusign.com/docs/navigator-api/',
          403
        );
      }
      if (agreementRes.status === 404) {
        // Check if this is a Navigator API not found error vs agreement not found
        if (
          errorDetails.includes('Navigator') ||
          errorDetails.includes('not available')
        ) {
          throw new AppError(
            'DocuSign Navigator API not found - may not be available for this account. To get access, please visit: https://developers.docusign.com/docs/navigator-api/',
            404
          );
        } else {
          throw new AppError('Agreement not found', 404);
        }
      }
      throw new AppError('Failed to retrieve agreement', agreementRes.status);
    }

    const agreementData = await agreementRes.json();

    return agreementData;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Agreement fetch failed', error as Error, {
      api: 'agreement_by_id',
      agreementId,
    });
    throw new AppError('DocuSign Navigator service unavailable', 503);
  }
}
