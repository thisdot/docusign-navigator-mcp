/**
 * MCP Handler Utilities
 * Common utilities for MCP tool handlers including error responses,
 * token extraction, logging, and agreement formatting
 */

import { logger } from '../logger.js';
import type {
  MCPToolResponse,
  ToolContext,
  Agreement,
  AgreementParty,
} from './types.js';

// MCP error response interface
export interface MCPErrorResponse {
  error: string;
  error_description?: string;
  tool?: string;
}

/**
 * Creates a standardized MCP error response
 * @param error - Error message or code
 * @param description - Detailed error description
 * @param toolName - Name of the tool that generated the error
 * @param additionalData - Additional data to include in annotation
 * @returns MCPToolResponse with error format
 */
export function createMCPErrorResponse(
  error: string,
  description?: string,
  toolName?: string,
  additionalData?: Record<string, unknown>
): MCPToolResponse {
  const errorResponse: MCPErrorResponse = {
    error,
    ...(description && { error_description: description }),
    ...(toolName && { tool: toolName }),
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(errorResponse, null, 2),
        annotation: {
          error: true,
          ...(toolName && { tool: toolName }),
          ...additionalData,
        },
      },
    ],
  };
}

/**
 * Extracts and validates access token from MCP tool context
 * @param context - MCP tool context
 * @param toolName - Name of the tool requesting the token (for logging)
 * @returns Access token string
 * @throws Error if token is missing or invalid
 */
export function extractAccessToken(
  context: ToolContext,
  toolName?: string
): string {
  if (!context.authInfo?.token) {
    const error = 'Access token is required but not provided in context';
    if (toolName) {
      logger.error(
        `Token extraction failed for tool: ${toolName}`,
        new Error(error)
      );
    }
    throw new Error(error);
  }

  // Basic token validation (non-empty string)
  const token = context.authInfo.token.trim();
  if (!token) {
    const error = 'Access token is empty or invalid';
    if (toolName) {
      logger.error(
        `Token validation failed for tool: ${toolName}`,
        new Error(error)
      );
    }
    throw new Error(error);
  }

  return token;
}

/**
 * Logs MCP tool usage with consistent format
 * @param toolName - Name of the tool being used
 * @param input - Input parameters (will be sanitized)
 * @param context - Tool context (token will be redacted)
 * @param additionalInfo - Additional logging information
 */
export function logToolUsage(
  toolName: string,
  input?: Record<string, unknown>,
  context?: ToolContext,
  additionalInfo?: Record<string, unknown>
): void {
  // Sanitize input to avoid logging sensitive data
  const sanitizedInput = input ? { ...input } : {};

  // Redact any potential sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
  Object.keys(sanitizedInput).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitizedInput[key] = '[REDACTED]';
    }
  });

  logger.info(`MCP tool called: ${toolName}`, {
    tool: toolName,
    input: sanitizedInput,
    hasAuth: !!context?.authInfo?.token,
    clientId: context?.authInfo?.clientId,
    scopes: context?.authInfo?.scopes,
    ...additionalInfo,
  });
}

/**
 * Formats agreement display information consistently
 * @param agreement - Agreement object to format
 * @returns Formatted display object
 */
export function formatAgreementDisplay(agreement: Agreement): {
  id: string;
  title: string;
  displayName: string;
  parties: string;
  status: string;
  type: string;
} {
  const title = agreement.title || agreement.file_name || 'Untitled Agreement';
  const displayName = agreement.file_name || title;

  // Format parties list
  const parties =
    agreement.parties && agreement.parties.length > 0
      ? agreement.parties
          .map(
            (party: AgreementParty) =>
              party.preferred_name || party.name_in_agreement || 'Unknown Party'
          )
          .join(', ')
      : 'No parties specified';

  return {
    id: agreement.id,
    title,
    displayName,
    parties,
    status: agreement.status || 'Unknown',
    type: agreement.type || 'Agreement',
  };
}
