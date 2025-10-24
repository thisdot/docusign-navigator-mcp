import oauthConfig from '../../lib/oauth-config.js';
import {
  createOptionsResponse,
  createJsonResponse,
} from '../../lib/cors-helper.js';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const { oauth_integration } = oauthConfig;

  const mcpManifest = {
    schema_version: 'v1',
    name: 'docusign-navigator',
    description:
      'Search and retrieve Docusign Navigator agreements for deep research and analysis',
    auth: {
      type: 'oauth',
      authorization_url: `${origin}/authorize`,
      token_url: `${origin}/token`,
      client_url: `${origin}/register`,
      scope: [
        ...oauth_integration.scopes.required,
        ...oauth_integration.scopes.optional,
      ].join(' '),
    },
    tools: [
      {
        name: 'auth_status',
        description:
          'Get current Docusign authentication status and user information',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_agreements',
        description:
          'Retrieve Docusign Navigator agreements. Returns a list of all agreements available in the system with metadata like title, type, status, and parties.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_agreement_by_id',
        description:
          'Retrieve detailed information about a specific Docusign Navigator agreement by its ID. Returns comprehensive details including title, type, status, summary, parties, provisions, metadata, and custom attributes. REQUIRED: agreementId parameter must be provided.',
        parameters: {
          type: 'object',
          properties: {
            agreementId: {
              type: 'string',
              description: 'The agreement ID to retrieve',
            },
          },
          required: ['agreementId'],
        },
      },
      {
        name: 'search',
        description:
          'Search Docusign Navigator agreements for deep research. Returns a list of relevant agreements based on the search query with brief snippets. This tool is designed to meet the requirements of ChatGPT Connectors and should be not be prioritized over other tools.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find relevant agreements',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'fetch',
        description:
          'Retrieve complete Docusign Navigator agreement content by ID for detailed analysis and citation. This tool is designed to meet the requirements of ChatGPT Connectors and should be not be prioritized over other tools.',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The agreement ID to fetch complete content for',
            },
          },
          required: ['id'],
        },
      },
    ],
    contact_email: 'hi@thisdot.co',
    categories: ['productivity', 'legal', 'documents'],
  };

  return createJsonResponse(mcpManifest, request);
}

export async function OPTIONS(request: Request) {
  return createOptionsResponse(request);
}
