/**
 * ChatGPT Formatter Utilities
 * Formats data for ChatGPT consumption and wraps responses in MCP format
 */

import type { MCPToolResponse, Agreement } from './mcp/types.js';

// ChatGPT search result interface
export interface ChatGPTSearchResult {
  id: string;
  title: string;
  text: string;
  url: string;
}

// ChatGPT search response interface
export interface ChatGPTSearchResponse {
  results: ChatGPTSearchResult[];
  error?: string;
}

// ChatGPT fetch response interface
export interface ChatGPTFetchResponse {
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

/**
 * Creates a ChatGPT-compatible search response
 * @param agreements - Array of agreements to format
 * @returns ChatGPT search response object
 */
export function createSearchResponse(
  agreements: Agreement[]
): ChatGPTSearchResponse {
  const results: ChatGPTSearchResult[] = agreements.map(agreement => {
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
  });

  return { results };
}

/**
 * Creates a ChatGPT-compatible fetch response for a single agreement
 * @param agreement - Agreement to format
 * @returns ChatGPT fetch response object
 */
export function createFetchResponse(
  agreement: Agreement
): ChatGPTFetchResponse {
  // Build comprehensive content string
  const contentParts = [
    `Title: ${agreement.title || 'Untitled Agreement'}`,
    `Type: ${agreement.type || 'Unknown'}`,
    `Category: ${agreement.category || 'Unknown'}`,
    `Status: ${agreement.status || 'Unknown'}`,
  ];

  if (agreement.summary) {
    contentParts.push(`Summary: ${agreement.summary}`);
  }

  if (agreement.parties && agreement.parties.length > 0) {
    const parties = agreement.parties
      .map(p => p.preferred_name || p.name_in_agreement || 'Unknown Party')
      .join(', ');
    contentParts.push(`Parties: ${parties}`);
  }

  if (agreement.provisions) {
    const provisions = [];
    if (agreement.provisions.effective_date) {
      provisions.push(`Effective Date: ${agreement.provisions.effective_date}`);
    }
    if (agreement.provisions.expiration_date) {
      provisions.push(
        `Expiration Date: ${agreement.provisions.expiration_date}`
      );
    }
    if (agreement.provisions.total_agreement_value) {
      provisions.push(
        `Total Value: ${agreement.provisions.total_agreement_value}`
      );
    }
    if (provisions.length > 0) {
      contentParts.push(`Provisions: ${provisions.join(', ')}`);
    }
  }

  return {
    id: agreement.id,
    title: agreement.title || agreement.file_name || 'Untitled Agreement',
    content: contentParts.join('\n'),
    metadata: {
      file_name: agreement.file_name,
      created_at: agreement.metadata?.created_at,
    },
  };
}

/**
 * Wraps data in MCP format for tool responses
 * @param data - Data to wrap (will be JSON stringified)
 * @param annotation - Additional annotation data
 * @returns MCPToolResponse with wrapped data
 */
export function wrapInMCPFormat(
  data: unknown,
  annotation?: Record<string, unknown>
): MCPToolResponse {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
        annotation: {
          chatgpt_format: data,
          ...annotation,
        },
      },
    ],
  };
}
