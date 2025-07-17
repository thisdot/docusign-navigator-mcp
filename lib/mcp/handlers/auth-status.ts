import { validateDocuSignToken } from '../../docusign-service.js';
import { logger } from '../../logger.js';
import type {
  ToolHandler,
  MCPToolResponse,
  ToolContext,
  DocuSignAccount,
} from '../types.js';

export const authStatusHandler: ToolHandler = async (
  _input: Record<string, unknown>,
  context: ToolContext
): Promise<MCPToolResponse> => {
  // Log tool usage
  logger.info('MCP tool called: auth_status');

  try {
    const accessToken = context.authInfo!.token;

    // Validate the token and get user information from DocuSign
    const validationResult = await validateDocuSignToken(accessToken);

    if (!validationResult.isValid) {
      return {
        content: [
          {
            type: 'text',
            text: `Authentication Status: INVALID\nError: ${validationResult.error || 'Token validation failed'}`,
          },
        ],
      };
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
    logger.error('Authentication status check failed', error as Error, {
      tool: 'auth_status',
    });

    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      content: [
        {
          type: 'text',
          text: `Authentication Status: ERROR\nError: ${errorMessage}`,
        },
      ],
    };
  }
};
