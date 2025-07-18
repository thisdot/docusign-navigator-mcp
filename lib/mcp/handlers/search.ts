import { fetchAgreements } from '../../docusign-service.js';
import { logger } from '../../logger.js';
import type {
  ToolHandler,
  MCPToolResponse,
  ToolContext,
  Agreement,
} from '../types.js';

interface SearchInput {
  query: string;
}

interface SearchResult {
  id: string;
  title: string;
  text: string;
  url: string;
}

interface SearchResponse {
  results: SearchResult[];
  error?: string;
}

export const searchHandler: ToolHandler<SearchInput> = async (
  { query }: SearchInput,
  context: ToolContext
): Promise<MCPToolResponse> => {
  // Log tool usage
  logger.info(`MCP tool called: search`);

  try {
    const accessToken = context.authInfo!.token;

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

    // Transform to ChatGPT-compatible format
    const results: SearchResult[] = filteredAgreements.map(
      (agreement: Agreement) => {
        // Create a brief text snippet for the search result
        const snippet = agreement.summary
          ? agreement.summary.length > 200
            ? agreement.summary.substring(0, 200) + '...'
            : agreement.summary
          : `${agreement.type || 'Agreement'} - ${agreement.category || 'Unknown category'}`;

        return {
          id: agreement.id,
          title: agreement.title || agreement.file_name || 'Untitled Agreement',
          text: snippet,
          url: `https://navigator.docusign.com/agreement/${agreement.id}`, // Placeholder URL
        };
      }
    );

    // Return ChatGPT-compatible data wrapped in MCP format
    const chatgptResponse: SearchResponse = { results };
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(chatgptResponse, null, 2),
          annotation: {
            chatgpt_format: chatgptResponse,
            query: query,
            count: results.length,
          },
        },
      ],
    };
  } catch (error) {
    logger.error('Agreement search failed', error as Error, {
      tool: 'search',
      query,
    });

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Return error in MCP format with ChatGPT-compatible data
    const errorResponse: SearchResponse = {
      results: [],
      error: `Search failed: ${errorMessage}`,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(errorResponse, null, 2),
          annotation: {
            chatgpt_format: errorResponse,
            query: query,
            error: true,
          },
        },
      ],
    };
  }
};
