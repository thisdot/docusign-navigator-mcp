/**
 * Agreement Formatter Utilities
 * Standardizes agreement data formatting for consistent display
 * across different contexts and outputs
 */

import type {
  Agreement,
  AgreementParty,
  AgreementProvisions,
  AgreementMetadata,
} from './mcp/types.js';

// Formatted agreement summary interface
export interface FormattedAgreementSummary {
  id: string;
  title: string;
  type: string;
  status: string;
  parties: string;
  effectiveDate?: string;
  expirationDate?: string;
}

// Formatted agreement details interface
export interface FormattedAgreementDetails {
  id: string;
  title: string;
  fileName: string;
  type: string;
  category: string;
  status: string;
  summary: string;
  parties: FormattedParty[];
  provisions: FormattedProvisions;
  metadata: FormattedMetadata;
}

export interface FormattedParty {
  preferredName: string;
  nameInAgreement: string;
  displayName: string;
}

export interface FormattedProvisions {
  effectiveDate: string;
  expirationDate: string;
  totalValue: string;
  hasEffectiveDate: boolean;
  hasExpirationDate: boolean;
  hasTotalValue: boolean;
}

export interface FormattedMetadata {
  createdAt: string;
  hasCreatedAt: boolean;
}

/**
 * Formats agreement data into a summary format
 * @param agreement - Raw agreement data
 * @returns Formatted summary object
 */
export function formatAgreementSummary(
  agreement: Agreement
): FormattedAgreementSummary {
  const parties = formatPartiesList(agreement.parties || []);

  return {
    id: agreement.id,
    title: agreement.title || agreement.file_name || 'Untitled Agreement',
    type: agreement.type || 'Unknown Type',
    status: agreement.status || 'Unknown Status',
    parties,
    ...(agreement.provisions?.effective_date && {
      effectiveDate: agreement.provisions.effective_date,
    }),
    ...(agreement.provisions?.expiration_date && {
      expirationDate: agreement.provisions.expiration_date,
    }),
  };
}

/**
 * Formats agreement data into detailed format
 * @param agreement - Raw agreement data
 * @returns Formatted details object
 */
export function formatAgreementDetails(
  agreement: Agreement
): FormattedAgreementDetails {
  return {
    id: agreement.id,
    title: agreement.title || 'Untitled Agreement',
    fileName: agreement.file_name || 'Unknown File',
    type: agreement.type || 'Unknown Type',
    category: agreement.category || 'Unknown Category',
    status: agreement.status || 'Unknown Status',
    summary: agreement.summary || 'No summary available',
    parties: (agreement.parties || []).map(formatParty),
    provisions: formatProvisions(agreement.provisions),
    metadata: formatMetadata(agreement.metadata),
  };
}

/**
 * Formats parties list into a readable string
 * @param parties - Array of agreement parties
 * @returns Formatted parties string
 */
export function formatPartiesList(parties: AgreementParty[]): string {
  if (!parties || parties.length === 0) {
    return 'No parties specified';
  }

  return parties
    .map(
      party =>
        party.preferred_name || party.name_in_agreement || 'Unknown Party'
    )
    .join(', ');
}

/**
 * Formats agreement provisions with fallbacks
 * @param provisions - Raw provisions data
 * @returns Formatted provisions object
 */
export function formatProvisions(
  provisions?: AgreementProvisions
): FormattedProvisions {
  return {
    effectiveDate: provisions?.effective_date || 'Not specified',
    expirationDate: provisions?.expiration_date || 'Not specified',
    totalValue: provisions?.total_agreement_value || 'Not specified',
    hasEffectiveDate: !!provisions?.effective_date,
    hasExpirationDate: !!provisions?.expiration_date,
    hasTotalValue: !!provisions?.total_agreement_value,
  };
}

/**
 * Formats a single party with fallbacks
 * @param party - Raw party data
 * @returns Formatted party object
 */
function formatParty(party: AgreementParty): FormattedParty {
  const preferredName = party.preferred_name || 'Unknown';
  const nameInAgreement = party.name_in_agreement || 'Unknown';
  const displayName =
    party.preferred_name || party.name_in_agreement || 'Unknown Party';

  return {
    preferredName,
    nameInAgreement,
    displayName,
  };
}

/**
 * Formats metadata with fallbacks
 * @param metadata - Raw metadata
 * @returns Formatted metadata object
 */
function formatMetadata(metadata?: AgreementMetadata): FormattedMetadata {
  return {
    createdAt: metadata?.created_at || 'Unknown',
    hasCreatedAt: !!metadata?.created_at,
  };
}
