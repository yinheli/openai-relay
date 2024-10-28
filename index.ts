import { serve } from "bun";
import { config } from "./config";

interface ProxyFetchOptions extends RequestInit {
  proxy?: string;
}

const server = serve({
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Handle health check endpoint
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }

    // Only handle POST requests
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const searchParams = url.search; // Preserve query parameters
    
    // Get request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new Response("Invalid JSON body", { status: 400 });
    }
    
    // Determine provider based on model prefix
    const model = body.model as string;
    if (!model) {
      return new Response("Model is required", { status: 400 });
    }

    let targetProvider = null;
    for (const [_, provider] of Object.entries(config.providers)) {
      if (model.startsWith(provider.prefix)) {
        targetProvider = provider;
        // Remove provider prefix from model name
        body.model = model.replace(`${provider.prefix}-`, '');
        break;
      }
    }

    if (!targetProvider) {
      // If no matching provider, forward to OpenAI
      targetProvider = {
        baseURL: "https://api.openai.com",
        prefix: "",
        models: [],
      };
    }

    // Build forwarding request
    const targetURL = `${targetProvider.baseURL}${path}${searchParams}`;
    const proxyUrl = targetProvider.proxy || config.defaultProxy;

    // Filter and forward necessary headers
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    
    // Forward Authorization header
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      headers.set("Authorization", authHeader);
    }

    // Forward OpenAI-specific headers
    const openAIHeaders = [
      "OpenAI-Organization",
      "OpenAI-Beta",
      "HTTP-Referer",
      "X-Request-ID",
    ];

    for (const header of openAIHeaders) {
      const value = req.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    }
    
    const fetchOptions: ProxyFetchOptions = {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    };

    // Add proxy if configured
    if (proxyUrl) {
      fetchOptions.proxy = proxyUrl;
    }

    try {
      const response = await fetch(targetURL, fetchOptions);

      // Check if it's a streaming response
      const isStream = response.headers.get("content-type")?.includes("text/event-stream");
      if (isStream) {
        // Forward the streaming response
        return new Response(response.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
          status: response.status,
        });
      }

      // Handle regular JSON response
      const responseData = await response.json();
      return new Response(JSON.stringify(responseData), {
        headers: {
          "Content-Type": "application/json",
        },
        status: response.status,
      });
    } catch (error: any) {
      console.error("Proxy error:", error);
      return new Response(JSON.stringify({ 
        error: error?.message || 'Unknown error',
        details: error?.stack
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  },
  hostname: "0.0.0.0",
  port: process.env.PORT || 7000,
});

console.log(`Listening on ${server.url}`);
