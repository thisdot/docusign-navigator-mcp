import { fetchAgreements } from '../../docusign-service.js';
import { extractAccessToken, logToolUsage } from '../handler-utils.js';
import {
  createSearchResponse,
  wrapInMCPFormat,
} from '../../chatgpt-formatter.js';
import type {
  ToolHandler,
  MCPToolResponse,
  ToolContext,
  Agreement,
} from '../types.js';

interface SearchInput {
  query: string;
}

export const searchHandler: ToolHandler<SearchInput> = async (
  { query }: SearchInput,
  context: ToolContext
): Promise<MCPToolResponse> => {
  // Log tool usage with standardized format
  logToolUsage('search', { query }, context);

  try {
    const accessToken = extractAccessToken(context, 'search');

    // Use the existing fetchAgreements service function
    const agreementsData = await fetchAgreements(accessToken);
    const agreements = agreementsData.data || [];

    // Filter agreements based on the search query
    const searchTerms = query.toLowerCase().split(' ');
    const filteredAgreements = agreements.filter((agreement: Agreement) => {
      const searchableText = [
        agreement.title || '',
        agreement.summary || '',
        agreement.type || '',
        agreement.category || '',
        agreement.file_name || '',
        ...(agreement.parties || []).map(
          p => `${p.preferred_name || ''} ${p.name_in_agreement || ''}`
        ),
      ]
        .join(' ')
        .toLowerCase();

      return searchTerms.some(term => searchableText.includes(term));
    });

    // Create ChatGPT-compatible response using standardized formatter
    const chatgptResponse = createSearchResponse(filteredAgreements);

    return wrapInMCPFormat(chatgptResponse, {
      query: query,
      count: filteredAgreements.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Return error in ChatGPT-compatible format
    const errorResponse = {
      results: [],
      error: `Search failed: ${errorMessage}`,
    };

    return wrapInMCPFormat(errorResponse, {
      query: query,
      error: true,
    });
  }
};
