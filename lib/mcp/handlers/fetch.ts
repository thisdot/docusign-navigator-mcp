import { fetchAgreementById } from '../../docusign-service.js';
import { logger } from '../../logger.js';
import type {
  ToolHandler,
  MCPToolResponse,
  ToolContext,
  Agreement,
} from '../types.js';

interface FetchInput {
  id: string;
}

interface FetchResult {
  id: string;
  title: string;
  text: string;
  url: string;
  metadata: {
    type?: string;
    category?: string;
    status?: string;
    file_name?: string;
    created_at?: string;
    parties_count: number;
    has_provisions: boolean;
    raw_data: Agreement;
    error?: boolean;
  };
}

export const fetchHandler: ToolHandler<FetchInput> = async (
  { id }: FetchInput,
  context: ToolContext
): Promise<MCPToolResponse> => {
  // Log tool usage
  logger.info(`MCP tool called: fetch`);

  try {
    const accessToken = context.authInfo!.token;

    // Use the existing fetchAgreementById service function
    const agreement: Agreement = await fetchAgreementById(accessToken, id);

    // Build comprehensive text content for the agreement
    const textParts = [
      `Title: ${agreement.title || 'Untitled Agreement'}`,
      `Type: ${agreement.type || 'Unknown'}`,
      `Category: ${agreement.category || 'Unknown'}`,
      `Status: ${agreement.status || 'Unknown'}`,
      `File: ${agreement.file_name || 'Unknown'}`,
    ];

    // Add parties information
    if (agreement.parties && agreement.parties.length > 0) {
      textParts.push(`\nParties:`);
      agreement.parties.forEach((party, index) => {
        textParts.push(
          `${index + 1}. ${party.preferred_name || party.name_in_agreement || 'Unknown Party'}`
        );
      });
    }

    // Add provisions information
    if (agreement.provisions) {
      textParts.push(`\nKey Provisions:`);
      if (agreement.provisions.effective_date) {
        textParts.push(
          `Effective Date: ${new Date(agreement.provisions.effective_date).toLocaleDateString()}`
        );
      }
      if (agreement.provisions.expiration_date) {
        textParts.push(
          `Expiration Date: ${new Date(agreement.provisions.expiration_date).toLocaleDateString()}`
        );
      }
      if (agreement.provisions.total_agreement_value) {
        textParts.push(
          `Total Value: ${agreement.provisions.total_agreement_value}`
        );
      }
    }

    // Add summary
    if (agreement.summary) {
      textParts.push(`\nSummary:\n${agreement.summary}`);
    }

    // Add metadata
    if (agreement.metadata?.created_at) {
      textParts.push(
        `\nCreated: ${new Date(agreement.metadata.created_at).toLocaleString()}`
      );
    }

    const fullText = textParts.join('\n');

    // Return ChatGPT-compatible data wrapped in MCP format
    const chatgptResponse: FetchResult = {
      id: agreement.id,
      title: agreement.title || agreement.file_name || 'Untitled Agreement',
      text: fullText,
      url: `https://navigator.docusign.com/agreement/${agreement.id}`, // Placeholder URL
      metadata: {
        type: agreement.type,
        category: agreement.category,
        status: agreement.status,
        file_name: agreement.file_name,
        created_at: agreement.metadata?.created_at,
        parties_count: agreement.parties?.length || 0,
        has_provisions: !!agreement.provisions,
        raw_data: agreement, // Include full raw data for debugging
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(chatgptResponse, null, 2),
          annotation: {
            chatgpt_format: chatgptResponse,
            agreement_id: id,
            title: chatgptResponse.title,
          },
        },
      ],
    };
  } catch (error) {
    logger.error('Agreement fetch failed', error as Error, {
      tool: 'fetch',
      agreementId: id,
    });

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Return error in MCP format with ChatGPT-compatible data
    const errorResponse: FetchResult = {
      id: id,
      title: 'Error',
      text: `Failed to retrieve agreement: ${errorMessage}`,
      url: '',
      metadata: {
        error: true,
        parties_count: 0,
        has_provisions: false,
        raw_data: {} as Agreement,
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(errorResponse, null, 2),
          annotation: {
            chatgpt_format: errorResponse,
            agreement_id: id,
            error: true,
          },
        },
      ],
    };
  }
};
