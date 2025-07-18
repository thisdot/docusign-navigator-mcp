import { fetchAgreementById } from '../../docusign-service.js';
import { logger } from '../../logger.js';
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
  // Log tool usage
  logger.info(`MCP tool called: get_agreement_by_id`);

  try {
    const accessToken = context.authInfo!.token;

    // Use the existing fetchAgreementById service function
    const agreementData = await fetchAgreementById(accessToken, agreementId);

    // Format the response similar to get_agreements
    const agreement: Agreement = agreementData;
    const displayText = `DocuSign Navigator Agreement Details:

Title: ${agreement.title || 'No Title'}
ID: ${agreement.id}
Type: ${agreement.type || 'Unknown'}
Category: ${agreement.category || 'Unknown'}
Status: ${agreement.status || 'Unknown'}
File: ${agreement.file_name || 'Unknown'}${
      agreement.parties && agreement.parties.length > 0
        ? `
Parties: ${agreement.parties
            .map(p => p.preferred_name || p.name_in_agreement)
            .filter(Boolean)
            .join(', ')}`
        : ''
    }${
      agreement.provisions?.effective_date
        ? `
Effective Date: ${new Date(agreement.provisions.effective_date).toLocaleDateString()}`
        : ''
    }${
      agreement.provisions?.expiration_date
        ? `
Expiration Date: ${new Date(agreement.provisions.expiration_date).toLocaleDateString()}`
        : ''
    }${
      agreement.provisions?.total_agreement_value
        ? `
Total Value: ${agreement.provisions.total_agreement_value}`
        : ''
    }${
      agreement.summary
        ? `
Summary: ${agreement.summary}`
        : ''
    }${
      agreement.metadata?.created_at
        ? `
Created: ${new Date(agreement.metadata.created_at).toLocaleString()}`
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
    logger.error('Failed to retrieve agreement by ID', error as Error, {
      tool: 'get_agreement_by_id',
      agreementId,
    });

    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving agreement: ${errorMessage}`,
        },
      ],
    };
  }
};
