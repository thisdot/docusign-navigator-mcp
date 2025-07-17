import { getBaseUrl } from '../lib/url-helper.js';

export async function GET() {
  const baseUrl = getBaseUrl();

  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'DocuSign Navigator MCP Server',
      description:
        'MCP server for searching and retrieving DocuSign Navigator agreements for deep research',
      version: '1.0.0',
      contact: {
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: baseUrl,
        description: 'DocuSign Navigator MCP Server',
      },
    ],
    paths: {
      '/api/mcp': {
        post: {
          summary: 'MCP Server Endpoint',
          description:
            'Model Context Protocol server endpoint for DocuSign Navigator integration',
          operationId: 'mcpServer',
          security: [
            {
              oauth2: [
                'signature',
                'impersonation',
                'adm_store_unified_repo_read',
                'models_read',
              ],
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  description: 'MCP protocol message',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'MCP protocol response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    description: 'MCP protocol response message',
                  },
                },
              },
            },
            '401': {
              description: 'Authentication required',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        example: 'Authentication required',
                      },
                    },
                  },
                },
              },
            },
            '403': {
              description: 'Insufficient permissions',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        example: 'Insufficient permissions',
                      },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        example: 'Internal server error',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/authorize': {
        get: {
          summary: 'OAuth Authorization Endpoint',
          description:
            'Initiate OAuth authorization flow for DocuSign Navigator access',
          operationId: 'authorize',
          parameters: [
            {
              name: 'client_id',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'OAuth client ID',
            },
            {
              name: 'redirect_uri',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'OAuth redirect URI',
            },
            {
              name: 'response_type',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
                enum: ['code'],
              },
              description: 'OAuth response type',
            },
            {
              name: 'scope',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
              },
              description: 'OAuth scopes',
            },
            {
              name: 'state',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
              },
              description: 'OAuth state parameter',
            },
          ],
          responses: {
            '302': {
              description: 'Redirect to DocuSign authorization',
            },
            '400': {
              description: 'Invalid request parameters',
            },
          },
        },
      },
      '/api/auth/token': {
        post: {
          summary: 'OAuth Token Exchange',
          description: 'Exchange authorization code for access token',
          operationId: 'token',
          requestBody: {
            required: true,
            content: {
              'application/x-www-form-urlencoded': {
                schema: {
                  type: 'object',
                  properties: {
                    grant_type: {
                      type: 'string',
                      enum: ['authorization_code'],
                    },
                    code: {
                      type: 'string',
                      description: 'Authorization code',
                    },
                    redirect_uri: {
                      type: 'string',
                      description: 'Redirect URI',
                    },
                    client_id: {
                      type: 'string',
                      description: 'OAuth client ID',
                    },
                    client_secret: {
                      type: 'string',
                      description: 'OAuth client secret',
                    },
                  },
                  required: ['grant_type', 'code', 'redirect_uri', 'client_id'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Access token response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      access_token: {
                        type: 'string',
                      },
                      token_type: {
                        type: 'string',
                        example: 'Bearer',
                      },
                      expires_in: {
                        type: 'integer',
                      },
                      scope: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid token request',
            },
          },
        },
      },
      '/api/auth/register': {
        post: {
          summary: 'OAuth Client Registration',
          description: 'Register OAuth client for dynamic client registration',
          operationId: 'register',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    client_name: {
                      type: 'string',
                    },
                    redirect_uris: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
                    scope: {
                      type: 'string',
                    },
                  },
                  required: ['client_name', 'redirect_uris'],
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Client registered successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      client_id: {
                        type: 'string',
                      },
                      client_secret: {
                        type: 'string',
                      },
                      client_name: {
                        type: 'string',
                      },
                      redirect_uris: {
                        type: 'array',
                        items: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid registration request',
            },
          },
        },
      },
      '/.well-known/oauth-authorization-server': {
        get: {
          summary: 'OAuth Authorization Server Metadata',
          description: 'OAuth 2.0 authorization server metadata',
          operationId: 'authServerMetadata',
          responses: {
            '200': {
              description: 'Authorization server metadata',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      issuer: {
                        type: 'string',
                      },
                      authorization_endpoint: {
                        type: 'string',
                      },
                      token_endpoint: {
                        type: 'string',
                      },
                      registration_endpoint: {
                        type: 'string',
                      },
                      scopes_supported: {
                        type: 'array',
                        items: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/.well-known/oauth-protected-resource': {
        get: {
          summary: 'OAuth Protected Resource Metadata',
          description: 'OAuth 2.0 protected resource metadata',
          operationId: 'protectedResourceMetadata',
          responses: {
            '200': {
              description: 'Protected resource metadata',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      resource: {
                        type: 'string',
                      },
                      authorization_servers: {
                        type: 'array',
                        items: {
                          type: 'string',
                        },
                      },
                      scopes_supported: {
                        type: 'array',
                        items: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        oauth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: `${baseUrl}/api/auth/authorize`,
              tokenUrl: `${baseUrl}/api/auth/token`,
              scopes: {
                signature: 'Access DocuSign signature functionality',
                impersonation: 'Impersonate users for DocuSign API access',
                adm_store_unified_repo_read:
                  'Read access to DocuSign Navigator agreements',
                models_read: 'Read access to DocuSign models',
              },
            },
          },
        },
      },
    },
  };

  return new Response(JSON.stringify(openApiSpec), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
