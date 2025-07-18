// lib/cors-helper.ts
export function createCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '*';

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, Accept, Accept-Language, Cache-Control, Connection, Origin, Pragma, Referer, Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site, User-Agent, sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform, MCP-Protocol-Version',
    'Access-Control-Allow-Credentials': 'false',
    'Access-Control-Max-Age': '86400',
  };
}

export function createOptionsResponse(request: Request): Response {
  return new Response(null, {
    status: 200,
    headers: createCorsHeaders(request),
  });
}

export function createJsonResponse(data: unknown, request: Request): Response {
  const corsHeaders = createCorsHeaders(request);

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
