# DocuSign Navigator MCP Server

A Model Context Protocol (MCP) server that provides secure DocuSign Navigator integration for AI assistants. Connect your AI tools to access and analyze DocuSign agreement data using natural language queries.

## Features

- **Secure OAuth 2.0 Authentication**: Complete DocuSign OAuth flow with PKCE support
- **DocuSign Navigator Integration**: Access comprehensive agreement data and metadata
- **Natural Language Queries**: Search and retrieve agreements using conversational AI
- **MCP Protocol Compliance**: Full compatibility with Model Context Protocol standards
- **Real-time Data Access**: Live connection to DocuSign Navigator for up-to-date information

## Quick Start

### Server URL

```
http://localhost:3000/mcp
```

### MCP Client Configuration

Add to your MCP client configuration:

```json
{
  "servers": {
    "docusign-navigator": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Setup Steps

1. **Add Server**: Configure the MCP server URL in your AI client
2. **Authenticate**: Complete OAuth flow when prompted to connect your DocuSign account
3. **Start Querying**: Use natural language to interact with your DocuSign data

## Available Tools

### `auth_status`

Check your DocuSign authentication status and user information.

**Example queries:**

- "Check my DocuSign authentication status"
- "Am I connected to DocuSign?"

### `get_agreements`

Retrieve all DocuSign Navigator agreements with comprehensive metadata.

**Example queries:**

- "Show me my DocuSign agreements"
- "List all my contracts"
- "What agreements do I have?"

### `get_agreement_by_id`

Get detailed information about a specific agreement by ID.

**Example queries:**

- "Tell me about agreement [ID]"
- "Show details for contract [ID]"
- "Get agreement information for [ID]"

### `search`

Search DocuSign Navigator agreements for deep research. Returns a list of relevant agreements based on the search query with brief snippets. This tool was developed for ChatGPT Connectors and should not be prioritized over other tools.

**Example queries:**

- "Find service agreements"
- "Search for contracts with company ABC"
- "Show me expired agreements"

### `fetch`

Retrieve complete DocuSign Navigator agreement content by ID for detailed analysis and citation. This tool was developed for ChatGPT Connectors and should not be prioritized over other tools.

**Example queries:**

- "Get full content for agreement [ID]"
- "Fetch complete details for contract [ID]"

## Client Integration Examples

### Visual Studio Code

1. Open Command Palette: `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type: `mcp: add server`
3. Select `HTTP (HTTP or Server-Sent Events)`
4. Enter: `http://localhost:3000/mcp`
5. Complete OAuth authentication when prompted

### Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "docusign-navigator": {
      "command": "mcp-server-fetch",
      "args": ["http://localhost:3000/mcp"]
    }
  }
}
```

### Generic MCP Client

```json
{
  "servers": {
    "docusign-navigator": {
      "url": "http://localhost:3000/mcp",
      "type": "http"
    }
  }
}
```

## Usage Examples

```
User: "Show me my DocuSign agreements"
AI: "You have 3 agreements: Contract A (pending), Contract B (completed), Contract C (in review)"

User: "Tell me about Contract A"
AI: "Contract A is a service agreement created on Jan 15th, currently pending signature"

User: "Search for agreements with XYZ Corp"
AI: "Found 2 agreements with XYZ Corp: Service Agreement (active) and NDA (completed)"
```

## Requirements

- **DocuSign Account**: Active DocuSign account with Navigator access
- **MCP Client**: Compatible AI client that supports Model Context Protocol
- **Internet Connection**: Required for OAuth authentication and API calls

## Security & Privacy

- **OAuth 2.0**: Secure authentication with PKCE support
- **Token Management**: Secure handling of access tokens
- **No Data Storage**: No agreement data is stored on our servers
- **Real-time Access**: Direct API calls to DocuSign Navigator

## Development

### Prerequisites

- Node.js 22+
- npm or yarn
- DocuSign Developer Account
- Vercel CLI (for deployment)

### Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/coston/docusign-navigator-mcp-vercel
cd docusign-navigator-mcp-vercel
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.example .env
```

4. Update `.env` with your DocuSign credentials:

```bash
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_SECRET_KEY=your_secret_key
DOCUSIGN_AUTH_SERVER=https://account-d.docusign.com
DOCUSIGN_REDIRECT_URI=http://localhost:3000/auth/callback
BASE_URL=http://localhost:3000
```

### DocuSign Application Setup

1. Create a DocuSign Developer account at [developers.docusign.com](https://developers.docusign.com/)
2. Create a new application in the DocuSign Admin panel
3. Configure OAuth redirect URIs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://your-domain.vercel.app/auth/callback`
4. Copy Integration Key and Secret Key to environment variables

### Local Development

```bash
# Start development server
npm run dev

# Or using Vercel CLI
vercel dev
```

The server will be available at `http://localhost:3000/mcp`

### API Endpoints

- **Health Check**: `/health`
- **MCP Server**: `/mcp`
- **OAuth Authorization**: `/authorize`
- **OAuth Token**: `/token`
- **OAuth Callback**: `/auth/callback`
- **OAuth Metadata**: `/.well-known/oauth-authorization-server`

### Deployment

#### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard:
   - `DOCUSIGN_INTEGRATION_KEY`
   - `DOCUSIGN_SECRET_KEY`
   - `DOCUSIGN_AUTH_SERVER`
   - `DOCUSIGN_REDIRECT_URI` (update to your Vercel URL)
3. Deploy the application
4. Update DocuSign app redirect URIs to include your Vercel URL

#### Environment Variables for Production

```bash
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_SECRET_KEY=your_secret_key
DOCUSIGN_AUTH_SERVER=https://account-d.docusign.com
DOCUSIGN_REDIRECT_URI=https://your-app.vercel.app/auth/callback
# Note: BASE_URL should be empty in production (Vercel sets VERCEL_URL automatically)
```

## Architecture

- **Framework**: Vercel API routes deployed on Vercel
- **Authentication**: OAuth 2.0 with PKCE for secure token exchange
- **MCP Implementation**: Built with `@modelcontextprotocol/sdk`
- **DocuSign Integration**: Direct API calls to DocuSign Navigator
- **Token Management**: Secure validation and refresh handling

## Troubleshooting

### Common Issues

**Authentication Failures**

- Verify DocuSign credentials in environment variables
- Check OAuth redirect URI configuration
- Ensure DocuSign Navigator is enabled for your account

**Connection Problems**

- Verify server URL is correct
- Check network connectivity
- Ensure MCP client supports HTTP transport

**No Data Returned**

- Confirm DocuSign Navigator access
- Check token validity with `auth_status` tool
- Verify agreement data exists in DocuSign Navigator

### Support

- **Issues**: [GitHub Issues](https://github.com/thisdot/docusign-navigator-mcp/issues)
- **Documentation**: [Model Context Protocol](https://modelcontextprotocol.io/)
