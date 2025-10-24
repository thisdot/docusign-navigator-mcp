import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { z } from 'zod';
import {
  authStatusHandler,
  getAgreementsHandler,
  getAgreementByIdHandler,
  searchHandler,
  fetchHandler,
} from '../lib/mcp/handlers/index.js';
import { createTokenVerifier } from '../lib/mcp/auth.js';

// Create the base MCP handler with both authenticated and non-authenticated tools
const handler = createMcpHandler(
  server => {
    // Authentication status tool that provides minimal Docusign user information
    server.tool(
      'auth_status',
      'Get current Docusign authentication status and user information',
      {}, // No input parameters needed
      authStatusHandler
    );

    // Get agreements tool that requires authentication
    server.tool(
      'get_agreements',
      'Retrieve Docusign Navigator agreements. Returns a list of all agreements available in the system with metadata like title, type, status, and parties.',
      {}, // No input parameters needed
      getAgreementsHandler
    );

    // Get agreement by ID tool that requires authentication
    server.tool(
      'get_agreement_by_id',
      'Retrieve detailed information about a specific Docusign Navigator agreement by its ID. Returns comprehensive details including title, type, status, summary, parties, provisions, metadata, and custom attributes. REQUIRED: agreementId parameter must be provided.',
      { agreementId: z.string().min(1, 'Agreement ID is required') },
      getAgreementByIdHandler
    );

    // ChatGPT-compatible search tool for deep research
    server.tool(
      'search',
      'Search Docusign Navigator agreements for deep research. Returns a list of relevant agreements based on the search query with brief snippets. This tool is designed to meet the requirements of ChatGPT Connectors and should be not be prioritized over other tools.',
      { query: z.string().min(1, 'Search query is required') },
      searchHandler
    );

    // ChatGPT-compatible fetch tool for deep research
    server.tool(
      'fetch',
      'Retrieve complete Docusign Navigator agreement content by ID for detailed analysis and citation. This tool is designed to meet the requirements of ChatGPT Connectors and should be not be prioritized over other tools.',
      { id: z.string().min(1, 'Agreement ID is required') },
      fetchHandler
    );
  },
  {
    // Optional server options
  }
);

// Wrap the handler with authentication - all tools require valid authentication
const authHandler = withMcpAuth(handler, createTokenVerifier(), {
  required: true, // All tools require authentication - this triggers 401 responses
  requiredScopes: ['signature'], // Require at least the signature scope
  resourceMetadataPath: '/.well-known/oauth-protected-resource', // Custom metadata path
});

export { authHandler as GET, authHandler as POST };
