import { validateDocuSignToken } from '../../docusign-service.js';
import {
  extractAccessToken,
  createMCPErrorResponse,
  logToolUsage,
} from '../handler-utils.js';
import type {
  ToolHandler,
  MCPToolResponse,
  ToolContext,
  DocuSignAccount,
} from '../types.js';

export const authStatusHandler: ToolHandler = async (
  input: Record<string, unknown>,
  context: ToolContext
): Promise<MCPToolResponse> => {
  // Log tool usage with standardized format
  logToolUsage('auth_status', input, context);

  try {
    const accessToken = extractAccessToken(context, 'auth_status');

    // Validate the token and get user information from Docusign
    const validationResult = await validateDocuSignToken(accessToken);

    if (!validationResult.isValid) {
      return createMCPErrorResponse(
        'authentication_failed',
        validationResult.error || 'Token validation failed',
        'auth_status'
      );
    }

    // Build simple authentication status
    const user = validationResult.userInfo;
    const defaultAccount = user?.accounts?.find(
      (acc: DocuSignAccount) => acc.is_default
    );

    const statusText = `Authentication Status: VALID

User: ${user?.name || 'Unknown'}
Email: ${user?.email || 'Unknown'}
Default Account: ${defaultAccount?.account_name || 'Unknown'}
Account ID: ${defaultAccount?.account_id || 'Unknown'}`;

    return {
      content: [
        {
          type: 'text',
          text: statusText,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createMCPErrorResponse(
      'internal_error',
      `Authentication status check failed: ${errorMessage}`,
      'auth_status'
    );
  }
};
