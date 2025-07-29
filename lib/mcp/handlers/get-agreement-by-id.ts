import { fetchAgreementById } from '../../docusign-service.js';
import {
  extractAccessToken,
  createMCPErrorResponse,
  logToolUsage,
} from '../handler-utils.js';
import { formatAgreementDetails } from '../../agreement-formatter.js';
import type {
  ToolHandler,
  MCPToolResponse,
  ToolContext,
  Agreement,
} from '../types.js';

interface GetAgreementByIdInput {
  agreementId: string;
}

export const getAgreementByIdHandler: ToolHandler<
  GetAgreementByIdInput
> = async (
  { agreementId }: GetAgreementByIdInput,
  context: ToolContext
): Promise<MCPToolResponse> => {
  // Log tool usage with standardized format
  logToolUsage('get_agreement_by_id', { agreementId }, context);

  try {
    const accessToken = extractAccessToken(context, 'get_agreement_by_id');

    // Use the existing fetchAgreementById service function
    const agreementData = await fetchAgreementById(accessToken, agreementId);

    // Format the response using the standardized formatter
    const agreement: Agreement = agreementData;
    const formatted = formatAgreementDetails(agreement);

    const displayText = `DocuSign Navigator Agreement Details:

Title: ${formatted.title}
ID: ${formatted.id}
Type: ${formatted.type}
Category: ${formatted.category}
Status: ${formatted.status}
File: ${formatted.fileName}
Parties: ${formatted.parties.map(p => p.displayName).join(', ')}${
      formatted.provisions.hasEffectiveDate
        ? `
Effective Date: ${new Date(formatted.provisions.effectiveDate).toLocaleDateString()}`
        : ''
    }${
      formatted.provisions.hasExpirationDate
        ? `
Expiration Date: ${new Date(formatted.provisions.expirationDate).toLocaleDateString()}`
        : ''
    }${
      formatted.provisions.hasTotalValue
        ? `
Total Value: ${formatted.provisions.totalValue}`
        : ''
    }${
      formatted.summary !== 'No summary available'
        ? `
Summary: ${formatted.summary}`
        : ''
    }${
      formatted.metadata.hasCreatedAt
        ? `
Created: ${new Date(formatted.metadata.createdAt).toLocaleString()}`
        : ''
    }`;

    return {
      content: [
        {
          type: 'text',
          text: displayText,
          annotation: {
            agreement: agreement,
            agreementId: agreementId,
            rawData: agreementData,
          },
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createMCPErrorResponse(
      'fetch_failed',
      `Failed to retrieve agreement: ${errorMessage}`,
      'get_agreement_by_id',
      { agreementId }
    );
  }
};
