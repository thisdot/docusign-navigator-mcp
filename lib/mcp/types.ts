// Define the AuthInfo type based on the mcp-handler interface
export interface AuthInfo {
  token: string;
  scopes: string[];
  clientId: string;
  extra?: Record<string, unknown>;
}

// Tool execution context with authentication information
export interface ToolContext {
  authInfo?: AuthInfo;
}

// Standard MCP tool response format
export interface MCPToolResponse {
  content: Array<{
    type: 'text';
    text: string;
    annotation?: Record<string, unknown>;
  }>;
  [key: string]: unknown; // Index signature for MCP compatibility
}

// Generic tool handler function type
export type ToolHandler<T = Record<string, unknown>> = (
  input: T,
  context: ToolContext
) => Promise<MCPToolResponse>;

// DocuSign user info types
export interface DocuSignAccount {
  account_id: string;
  account_name: string;
  is_default: boolean;
  base_uri?: string;
}

export interface DocuSignUserInfo {
  name: string;
  email: string;
  sub: string;
  accounts: DocuSignAccount[];
}

export interface TokenValidationResult {
  isValid: boolean;
  error?: string;
  userInfo?: DocuSignUserInfo;
}

// DocuSign Navigator Agreement types
export interface AgreementParty {
  preferred_name?: string;
  name_in_agreement?: string;
}

export interface AgreementProvisions {
  effective_date?: string;
  expiration_date?: string;
  total_agreement_value?: string;
}

export interface AgreementMetadata {
  created_at?: string;
}

export interface Agreement {
  id: string;
  title?: string;
  type?: string;
  category?: string;
  status?: string;
  file_name?: string;
  summary?: string;
  parties?: AgreementParty[];
  provisions?: AgreementProvisions;
  metadata?: AgreementMetadata;
}

export interface AgreementsResponse {
  data?: Agreement[];
}
