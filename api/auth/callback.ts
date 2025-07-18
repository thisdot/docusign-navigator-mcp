import { createOptionsResponse } from '../../lib/cors-helper.js';

interface MCPClientInfo {
  client_id: string;
  redirect_uri: string;
  original_state?: string;
  code_challenge: string;
  code_challenge_method: string;
  resource?: string;
  timestamp: number;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    // Handle error response from DocuSign
    if (error) {
      // If we have state, try to decode it and redirect to original client
      if (state) {
        try {
          const decodedState = JSON.parse(
            atob(decodeURIComponent(state))
          ) as MCPClientInfo;
          const errorUrl = new URL(decodedState.redirect_uri);
          errorUrl.searchParams.set('error', error);
          if (errorDescription) {
            errorUrl.searchParams.set('error_description', errorDescription);
          }
          if (decodedState.original_state) {
            errorUrl.searchParams.set('state', decodedState.original_state);
          }

          return new Response(null, {
            status: 302,
            headers: {
              Location: errorUrl.toString(),
              'Cache-Control': 'no-store',
              Pragma: 'no-cache',
            },
          });
        } catch (e) {
          // Continue to fallback error response
        }
      }

      // Fallback error response
      return new Response(
        JSON.stringify({
          error,
          error_description: errorDescription || 'Authorization failed',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            Pragma: 'no-cache',
          },
        }
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return new Response(
        JSON.stringify({
          error: 'invalid_request',
          error_description: 'Missing required parameters (code or state)',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            Pragma: 'no-cache',
          },
        }
      );
    }

    // Decode the MCP client information from state
    let mcpClientInfo: MCPClientInfo;
    try {
      mcpClientInfo = JSON.parse(
        atob(decodeURIComponent(state))
      ) as MCPClientInfo;
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: 'invalid_request',
          error_description: 'Invalid state parameter',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            Pragma: 'no-cache',
          },
        }
      );
    }

    // Validate timestamp (prevent replay attacks)
    const maxAge = 10 * 60 * 1000; // 10 minutes
    if (Date.now() - mcpClientInfo.timestamp > maxAge) {
      return new Response(
        JSON.stringify({
          error: 'invalid_request',
          error_description: 'State parameter has expired',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            Pragma: 'no-cache',
          },
        }
      );
    }

    // Build redirect URL back to MCP client
    const redirectUrl = new URL(mcpClientInfo.redirect_uri);
    redirectUrl.searchParams.set('code', code);

    // Include original state if it existed
    if (mcpClientInfo.original_state) {
      redirectUrl.searchParams.set('state', mcpClientInfo.original_state);
    }

    // Redirect back to the MCP client
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl.toString(),
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'server_error',
        error_description: 'Internal server error processing callback',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          Pragma: 'no-cache',
        },
      }
    );
  }
}

export async function OPTIONS(request: Request): Promise<Response> {
  return createOptionsResponse(request);
}
