# Docusign Navigator MCP Server

<div align="center">
  <img src="public/thisdot-labs-logo.png" alt="This Dot Labs" width="200"/>

**By This Dot Labs**

</div>

<br/>

A Model Context Protocol (MCP) server that connects your AI assistant to Docusign Navigator. Query and analyze your Docusign agreements using natural language - no complex APIs or manual searches required.

## Why Use This?

Transform how you work with Docusign agreements:

- **Natural Language Access**: Ask questions like "Show me my pending contracts" or "Find agreements with XYZ Corp"
- **AI-Powered Insights**: Let your AI assistant analyze agreement details, statuses, and metadata
- **Secure Connection**: OAuth 2.0 authentication keeps your Docusign data safe
- **No Code Required**: Works directly with compatible AI tools like Claude Desktop and VS Code

## What You Need

- Active Docusign account with Navigator access
- Compatible AI client (Claude Desktop, VS Code with MCP extension, etc.)
- Internet connection

## Getting Started

### 1. Add to Your AI Client

The server is deployed and ready to use at: **`https://docusign-navigator.thisdot.co/mcp`**

Choose your AI client below:

#### Claude Desktop

Add this to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "docusign-navigator": {
      "command": "mcp-server-fetch",
      "args": ["https://docusign-navigator.thisdot.co/mcp"]
    }
  }
}
```

#### Visual Studio Code

1. Open Command Palette: `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type: `mcp: add server`
3. Select `HTTP (HTTP or Server-Sent Events)`
4. Enter: `https://docusign-navigator.thisdot.co/mcp`

#### Other MCP Clients

Add to your configuration:

```json
{
  "servers": {
    "docusign-navigator": {
      "url": "https://docusign-navigator.thisdot.co/mcp",
      "type": "http"
    }
  }
}
```

### 2. Connect Your Docusign Account

When you first use a Docusign command, you'll be prompted to authenticate:

1. Your AI client will provide an authorization link
2. Click the link to sign in to Docusign
3. Authorize the connection
4. Return to your AI client - you're ready to go!

### 3. Start Using Natural Language

Try these example queries with your AI assistant:

```
"Show me my Docusign agreements"
"Tell me about agreement [ID]"
"Find contracts with ABC Company"
"What agreements are pending signature?"
```

## What You Can Do

Your AI assistant will have access to these capabilities:

### Check Authentication

"Am I connected to Docusign?"
"Check my authentication status"

### List Agreements

"Show me all my agreements"
"What contracts do I have?"
"List my Docusign documents"

### Get Agreement Details

"Tell me about agreement [ID]"
"Show me details for contract [ID]"

### Search Agreements

"Find service agreements"
"Search for contracts with ABC Company"
"Show me expired agreements"

## Example Conversation

```
You: "Show me my Docusign agreements"
AI: "You have 3 agreements:
     • Service Agreement with XYZ Corp (pending signature)
     • NDA with ABC Inc (completed)
     • Consulting Contract (in review)"

You: "Tell me more about the Service Agreement"
AI: "The Service Agreement with XYZ Corp was created on January 15th
     and is currently pending signature. It includes standard service
     terms and payment schedules."
```

## Security & Privacy

Your data stays secure:

- **OAuth 2.0 Authentication**: Industry-standard secure authentication
- **No Data Storage**: Your agreements are never stored on our servers
- **Direct API Access**: Real-time connection to your Docusign account
- **Revocable Access**: Disconnect anytime through your Docusign settings

## Troubleshooting

### Can't Connect?

1. Verify your Docusign account has Navigator access
2. Check that you completed the OAuth authorization
3. Try the "Check authentication status" command
4. Ensure your AI client supports MCP HTTP transport

### No Agreements Showing?

1. Confirm you have agreements in Docusign Navigator
2. Check that Navigator is enabled for your account
3. Try authenticating again

### Still Need Help?

- [Report an Issue](https://github.com/thisdot/docusign-navigator-mcp/issues)
- [Learn About MCP](https://modelcontextprotocol.io/)

## Contributing

Want to contribute or run your own instance? See our [Contributing Guide](CONTRIBUTING.md) for development setup, architecture details, and deployment instructions.
