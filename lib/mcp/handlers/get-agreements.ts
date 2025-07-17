import { fetchAgreements } from '../../docusign-service.js';
import { logger } from '../../logger.js';
import type {
  ToolHandler,
  MCPToolResponse,
  ToolContext,
  Agreement,
  AgreementParty,
} from '../types.js';

export const getAgreementsHandler: ToolHandler = async (
  _input: Record<string, unknown>,
  context: ToolContext
): Promise<MCPToolResponse> => {
  // Log tool usage
  logger.info('MCP tool called: get_agreements');

  try {
    const accessToken = context.authInfo!.token;

    // Use the existing fetchAgreements service function
    const agreementsData = await fetchAgreements(accessToken);
    const agreements = agreementsData.data || [];

    // Format the response
    const displayText = `Found ${agreements.length} DocuSign Navigator agreement${
      agreements.length !== 1 ? 's' : ''
    }${
      agreements.length > 0
        ? '\n\nAgreement Details:\n\n' +
          agreements
            .map((agreement: Agreement, index: number) =>
              [
                `${index + 1}. ${agreement.title || 'No Title'}`,
                `   ID: ${agreement.id}`,
                `   Type: ${agreement.type || 'Unknown'}`,
                `   Category: ${agreement.category || 'Unknown'}`,
                `   Status: ${agreement.status || 'Unknown'}`,
                `   File: ${agreement.file_name || 'Unknown'}`,
                ...(agreement.parties && agreement.parties.length > 0
                  ? [
                      `   Parties: ${agreement.parties
                        .map(
                          (p: AgreementParty) =>
                            p.preferred_name || p.name_in_agreement
                        )
                        .filter(Boolean)
                        .join(', ')}`,
                    ]
                  : []),
                ...(agreement.provisions?.effective_date
                  ? [
                      `   Effective Date: ${new Date(agreement.provisions.effective_date).toLocaleDateString()}`,
                    ]
                  : []),
                ...(agreement.provisions?.expiration_date
                  ? [
                      `   Expiration Date: ${new Date(agreement.provisions.expiration_date).toLocaleDateString()}`,
                    ]
                  : []),
                ...(agreement.provisions?.total_agreement_value
                  ? [
                      `   Total Value: ${agreement.provisions.total_agreement_value}`,
                    ]
                  : []),
                ...(agreement.summary
                  ? [
                      `   Summary: ${agreement.summary.length > 100 ? agreement.summary.substring(0, 100) + '...' : agreement.summary}`,
                    ]
                  : []),
                ...(agreement.metadata?.created_at
                  ? [
                      `   Created: ${new Date(agreement.metadata.created_at).toLocaleString()}`,
                    ]
                  : []),
              ].join('\n')
            )
            .join('\n\n')
        : ''
    }`;

    return {
      content: [
        {
          type: 'text',
          text: displayText,
          annotation: {
            count: agreements.length,
            agreements: agreements,
            rawData: agreementsData,
          },
        },
      ],
    };
  } catch (error) {
    logger.error('Failed to retrieve agreements', error as Error, {
      tool: 'get_agreements',
    });

    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving agreements: ${errorMessage}`,
        },
      ],
    };
  }
};
