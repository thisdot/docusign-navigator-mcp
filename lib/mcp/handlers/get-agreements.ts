import { fetchAgreements } from '../../docusign-service.js';
import {
  extractAccessToken,
  createMCPErrorResponse,
  logToolUsage,
} from '../handler-utils.js';
import { formatAgreementSummary } from '../../agreement-formatter.js';
import type {
  ToolHandler,
  MCPToolResponse,
  ToolContext,
  Agreement,
} from '../types.js';

export const getAgreementsHandler: ToolHandler = async (
  input: Record<string, unknown>,
  context: ToolContext
): Promise<MCPToolResponse> => {
  // Log tool usage with standardized format
  logToolUsage('get_agreements', input, context);

  try {
    const accessToken = extractAccessToken(context, 'get_agreements');

    // Use the existing fetchAgreements service function
    const agreementsData = await fetchAgreements(accessToken);
    const agreements = agreementsData.data || [];

    // Format the response using the standardized formatter
    const displayText = `Found ${agreements.length} DocuSign Navigator agreement${
      agreements.length !== 1 ? 's' : ''
    }${
      agreements.length > 0
        ? '\n\nAgreement Details:\n\n' +
          agreements
            .map((agreement: Agreement, index: number) => {
              const formatted = formatAgreementSummary(agreement);
              const lines = [
                `${index + 1}. ${formatted.title}`,
                `   ID: ${formatted.id}`,
                `   Type: ${formatted.type}`,
                `   Category: ${agreement.category || 'Unknown'}`,
                `   Status: ${formatted.status}`,
                `   File: ${agreement.file_name || 'Unknown'}`,
                `   Parties: ${formatted.parties}`,
              ];

              // Add optional fields if they exist
              if (formatted.effectiveDate) {
                lines.push(
                  `   Effective Date: ${new Date(formatted.effectiveDate).toLocaleDateString()}`
                );
              }
              if (formatted.expirationDate) {
                lines.push(
                  `   Expiration Date: ${new Date(formatted.expirationDate).toLocaleDateString()}`
                );
              }
              if (agreement.provisions?.total_agreement_value) {
                lines.push(
                  `   Total Value: ${agreement.provisions.total_agreement_value}`
                );
              }
              if (agreement.summary) {
                const summary =
                  agreement.summary.length > 100
                    ? agreement.summary.substring(0, 100) + '...'
                    : agreement.summary;
                lines.push(`   Summary: ${summary}`);
              }
              if (agreement.metadata?.created_at) {
                lines.push(
                  `   Created: ${new Date(agreement.metadata.created_at).toLocaleString()}`
                );
              }

              return lines.join('\n');
            })
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createMCPErrorResponse(
      'fetch_failed',
      `Failed to retrieve agreements: ${errorMessage}`,
      'get_agreements'
    );
  }
};
