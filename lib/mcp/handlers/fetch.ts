import { fetchAgreementById } from '../../docusign-service.js';
import { extractAccessToken, logToolUsage } from '../handler-utils.js';
import {
  createFetchResponse,
  wrapInMCPFormat,
} from '../../chatgpt-formatter.js';
import type {
  ToolHandler,
  MCPToolResponse,
  ToolContext,
  Agreement,
} from '../types.js';

interface FetchInput {
  id: string;
}

export const fetchHandler: ToolHandler<FetchInput> = async (
  { id }: FetchInput,
  context: ToolContext
): Promise<MCPToolResponse> => {
  // Log tool usage with standardized format
  logToolUsage('fetch', { id }, context);

  try {
    const accessToken = extractAccessToken(context, 'fetch');

    // Use the existing fetchAgreementById service function
    const agreement: Agreement = await fetchAgreementById(accessToken, id);

    // Create ChatGPT-compatible response using standardized formatter
    const chatgptResponse = createFetchResponse(agreement);

    // Add additional metadata for the fetch response
    const enhancedResponse = {
      ...chatgptResponse,
      url: `https://navigator.docusign.com/agreement/${agreement.id}`, // Placeholder URL
      metadata: {
        ...chatgptResponse.metadata,
        type: agreement.type,
        category: agreement.category,
        status: agreement.status,
        parties_count: agreement.parties?.length || 0,
        has_provisions: !!agreement.provisions,
        raw_data: agreement, // Include full raw data for debugging
      },
    };

    return wrapInMCPFormat(enhancedResponse, {
      agreement_id: id,
      title: enhancedResponse.title,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Return error in ChatGPT-compatible format
    const errorResponse = {
      id: id,
      title: 'Error',
      content: `Failed to retrieve agreement: ${errorMessage}`,
      url: '',
      metadata: {
        error: true,
        parties_count: 0,
        has_provisions: false,
        raw_data: {} as Agreement,
      },
    };

    return wrapInMCPFormat(errorResponse, {
      agreement_id: id,
      error: true,
    });
  }
};
