# Contributing to Docusign Navigator MCP Server

Thank you for your interest in contributing to the Docusign Navigator MCP Server! We appreciate your time and effort. Whether you're fixing bugs, adding features, improving documentation, or helping with testing, your contributions make this project better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Setup](#development-setup)
  - [Prerequisites](#prerequisites)
  - [Getting Started](#getting-started)
  - [Docusign Application Setup](#docusign-application-setup)
  - [Local Development](#local-development)
- [Architecture](#architecture)
- [API Routes](#api-routes)
- [Available MCP Tools](#available-mcp-tools)
- [Testing](#testing)
- [Code Style Guidelines](#code-style-guidelines)
- [Deployment](#deployment)
- [Publishing to MCP Registry](#publishing-to-mcp-registry)
- [Getting Help](#getting-help)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming and inclusive environment. By participating, you are expected to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Environment details** (Node version, OS, MCP client used)
- **Screenshots or logs** if applicable

Create an issue using our [bug report template](https://github.com/thisdot/docusign-navigator-mcp/issues/new).

### Suggesting Features

Feature suggestions are welcome! Please:

- **Check existing feature requests** to avoid duplicates
- **Clearly describe the feature** and its use case
- **Explain why this feature would be useful** to most users
- **Provide examples** of how it would work

### Submitting Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our code style guidelines
3. **Add or update tests** if applicable
4. **Update documentation** if needed
5. **Ensure all tests pass**
6. **Write a clear commit message** following [Conventional Commits](https://www.conventionalcommits.org/)
7. **Submit a pull request** with a comprehensive description

**Pull Request Guidelines:**

- Keep changes focused and atomic
- Reference related issues using `#issue-number`
- Include screenshots for UI changes
- Update the README.md if needed
- Ensure your code passes all checks

## Development Setup

### Prerequisites

- Node.js 22+
- npm or yarn
- Docusign Developer Account
- Vercel CLI (for deployment)
- Git

## Development Setup

### Getting Started

#### 1. Clone the Repository

```bash
git clone https://github.com/thisdot/docusign-navigator-mcp
cd docusign-navigator-mcp
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Update `.env` with your Docusign credentials:

```bash
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_SECRET_KEY=your_secret_key
DOCUSIGN_AUTH_SERVER=https://account-d.docusign.com
DOCUSIGN_REDIRECT_URI=http://localhost:3000/auth/callback
BASE_URL=http://localhost:3000
```

### Docusign Application Setup

#### 1. Create Developer Account

1. Sign up at [developers.docusign.com](https://developers.docusign.com/)
2. Navigate to the Admin panel
3. Create a new application

#### 2. Configure OAuth Settings

1. In your Docusign application settings:
   - Add redirect URI: `http://localhost:3000/auth/callback` (development)
   - Add redirect URI: `https://docusign-navigator.thisdot.co/auth/callback` (production)
   - Enable OAuth 2.0 Authorization Code Grant
   - Enable OAuth 2.0 PKCE

2. Copy your credentials:
   - Integration Key (Client ID)
   - Secret Key (Client Secret)

3. Add these to your `.env` file

#### 3. Enable Docusign Navigator

Ensure your Docusign account has Navigator enabled. Contact Docusign support if you need access.

### Local Development

#### Start Development Server

Using npm:

```bash
npm run dev
```

Or using Vercel CLI (recommended):

```bash
vercel dev
```

The server will be available at `http://localhost:3000/mcp`

#### Testing the MCP Server Locally

1. Configure your MCP client to use `http://localhost:3000/mcp`
2. Test the OAuth flow by attempting to authenticate
3. Verify all tools are working correctly

## Architecture

### Technology Stack

- **Runtime**: Node.js 22+
- **Framework**: Vercel serverless functions
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **OAuth**: PKCE flow for secure authentication
- **Docusign API**: Direct integration with Docusign Navigator

### Project Structure

```
├── api/
│   ├── authorize.ts         # OAuth authorization endpoint
│   ├── token.ts            # OAuth token exchange
│   ├── auth/
│   │   └── callback.ts     # OAuth callback handler
│   ├── mcp.ts              # Main MCP server endpoint
│   ├── health.ts           # Health check endpoint
│   └── .well-known/        # OAuth discovery endpoints
├── src/
│   ├── docusign-navigator-mcp-server.ts  # MCP server implementation
│   ├── oauth-helpers.ts                   # OAuth utilities
│   └── types.ts                           # TypeScript definitions
├── public/                 # Static assets
├── .env.example           # Environment template
└── vercel.json           # Vercel configuration
```

### Authentication Flow

1. Client requests MCP tools
2. Server checks for valid access token
3. If invalid, initiates OAuth flow:
   - Generates PKCE challenge
   - Redirects to Docusign authorization
   - User authenticates
   - Callback exchanges code for token
4. Token stored and used for Docusign API calls
5. Token automatically refreshed when expired

## API Routes

### OAuth Endpoints

```
GET/POST /api/register
  - OAuth client registration

GET /api/authorize
  - Initiates OAuth authorization flow
  - Parameters: response_type, client_id, redirect_uri, scope, code_challenge

POST /api/token
  - Exchanges authorization code for access token
  - Handles token refresh

GET /api/auth/callback
  - OAuth callback handler
  - Completes authorization flow
```

### Discovery Endpoints

```
GET /api/.well-known/oauth-authorization-server
  - OAuth server metadata

GET /api/.well-known/oauth-protected-resource
  - Protected resource metadata
```

### MCP Endpoint

```
POST /api/mcp
  - Main MCP server endpoint
  - Handles all MCP protocol requests
  - Requires authentication
```

### Monitoring

```
GET /api/health
  - Health check endpoint
  - Returns server status
```

## Available MCP Tools

### `auth_status`

Checks authentication status and returns user information.

**Implementation**: [src/docusign-navigator-mcp-server.ts](src/docusign-navigator-mcp-server.ts)

### `get_agreements`

Retrieves all agreements from Docusign Navigator with comprehensive metadata.

**API Called**: `GET /api/v2/navigator/agreements`

### `get_agreement_by_id`

Fetches detailed information for a specific agreement by ID.

**API Called**: `GET /api/v2/navigator/agreements/{agreementId}`

**Parameters**:

- `agreementId` (string, required): The agreement ID

### `search`

Searches Docusign Navigator agreements. Returns relevant agreements with snippets.

**API Called**: `POST /api/v2/navigator/agreements/search`

**Parameters**:

- `query` (string, required): Search query

**Note**: Developed for ChatGPT Connectors compatibility.

### `fetch`

Retrieves complete agreement content for detailed analysis.

**API Called**: `GET /api/v2/navigator/agreements/{agreementId}`

**Parameters**:

- `agreementId` (string, required): The agreement ID

**Note**: Developed for ChatGPT Connectors compatibility.

## Deployment

### Vercel Deployment (Recommended)

#### 1. Connect Repository

1. Import your repository to Vercel
2. Vercel will auto-detect the configuration

#### 2. Configure Environment Variables

Add these in the Vercel dashboard (Settings → Environment Variables):

```bash
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_SECRET_KEY=your_secret_key
DOCUSIGN_AUTH_SERVER=https://account-d.docusign.com
DOCUSIGN_REDIRECT_URI=https://docusign-navigator.thisdot.co/auth/callback
# Note: BASE_URL should be empty in production (Vercel sets VERCEL_URL)
```

#### 3. Deploy

```bash
vercel deploy --prod
```

#### 4. Update Docusign OAuth Configuration

Add your production URL to Docusign app redirect URIs:

- `https://docusign-navigator.thisdot.co/auth/callback`

### Environment Variables Reference

| Variable                   | Description                                        | Example                                               |
| -------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| `DOCUSIGN_INTEGRATION_KEY` | Docusign Integration Key (Client ID)               | `abc123...`                                           |
| `DOCUSIGN_SECRET_KEY`      | Docusign Secret Key                                | `secret123...`                                        |
| `DOCUSIGN_AUTH_SERVER`     | Docusign OAuth server URL                          | `https://account-d.docusign.com`                      |
| `DOCUSIGN_REDIRECT_URI`    | OAuth redirect URI                                 | `https://docusign-navigator.thisdot.co/auth/callback` |
| `BASE_URL`                 | Base URL for local dev (leave empty in production) | `http://localhost:3000`                               |

## Publishing to MCP Registry

This server is configured for automatic publishing to the [MCP Registry](https://github.com/modelcontextprotocol/registry).

### Automatic Publishing

Publishing happens automatically via GitHub Actions when:

- You create a version tag (e.g., `v1.0.0`)
- You manually trigger the workflow from the Actions tab

```bash
# Create and push a version tag
git tag v1.0.0
git push origin --tags
```

### Manual Publishing

Trigger manually from GitHub:

1. Go to Actions tab
2. Select "Publish to MCP Registry" workflow
3. Click "Run workflow"

### Registry Configuration

The server configuration is defined in [server.json](server.json):

```json
{
  "name": "docusign-navigator",
  "type": "remote",
  "url": "https://docusign-navigator.thisdot.co/mcp",
  "description": "Docusign Navigator integration for AI assistants"
}
```

## Testing

### Manual Testing

1. Start the development server
2. Configure an MCP client to use your local server
3. Test each tool:
   - `auth_status` - Verify authentication
   - `get_agreements` - List all agreements
   - `get_agreement_by_id` - Get specific agreement
   - `search` - Search for agreements
   - `fetch` - Fetch full agreement content

### Testing OAuth Flow

1. Clear any existing tokens
2. Trigger an MCP tool call
3. Verify OAuth redirect
4. Complete authentication
5. Verify token exchange
6. Verify tool call succeeds

### Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

## Code Style Guidelines

### TypeScript

- Use TypeScript for all code
- Define proper types for all functions
- Avoid `any` types when possible
- Use interfaces for complex objects

### Formatting

- Run `npm run format` before committing (if configured)
- Follow existing code style
- Use meaningful variable and function names

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new MCP tool for agreement analysis
fix: resolve OAuth token refresh issue
docs: update API documentation
chore: update dependencies
```

## Troubleshooting Development Issues

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### OAuth Issues

- Verify redirect URIs match exactly (no trailing slashes)
- Check that Integration Key and Secret Key are correct
- Ensure PKCE is enabled in Docusign app settings
- Verify Docusign account has Navigator access

### Token Expiration

Tokens expire after 1 hour. The server should automatically refresh them, but if you encounter issues:

1. Clear stored tokens
2. Re-authenticate
3. Check token refresh logic in [src/oauth-helpers.ts](src/oauth-helpers.ts)

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, missing semi-colons, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

**Examples:**

```
feat(auth): add PKCE support for OAuth flow
fix(mcp): resolve token refresh issue
docs: update installation instructions
chore(deps): update dependencies to latest versions
```

## Getting Help

Need assistance? Here are your options:

- **Questions**: Open a [GitHub Discussion](https://github.com/thisdot/docusign-navigator-mcp/discussions)
- **Bugs**: Report via [GitHub Issues](https://github.com/thisdot/docusign-navigator-mcp/issues)
- **MCP Documentation**: [modelcontextprotocol.io](https://modelcontextprotocol.io/)
- **Docusign API**: [developers.docusign.com](https://developers.docusign.com/)

## Recognition

All contributors will be recognized in our project. Significant contributions may be highlighted in release notes and on our website.

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Docusign Navigator MCP Server! Your efforts help make this tool better for the entire community.
