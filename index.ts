import { config } from "./config.ts";
import type { Provider } from "./types.ts";
interface ProxyFetchOptions extends RequestInit {
  proxy?: string;
}

interface RequestBody {
  model?: string;
}

const defaultProvider: Provider = {
  baseURL: "https://api.openai.com",
  prefix: "",
  apiKey: Deno.env.get("OPENAI_API_KEY") || "",
  models: [],
};

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // Handle health check endpoint
  if (path === "/health") {
    return Response.json({ status: "ok" });
  }

  console.info({
    path,
    method: req.method,
    ua: req.headers.get("User-Agent"),
    xff: req.headers.get("X-Forwarded-For"),
  });

  // Only handle POST requests
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const searchParams = url.search; // Preserve query parameters

  // Get request body
  let body: RequestBody;
  try {
    body = await req.json();
  } catch (error) {
    console.error({ error });
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Determine provider based on model prefix
  const model = body.model;

  let targetProvider = null;
  for (const [_, provider] of Object.entries(config.providers)) {
    if (model?.startsWith(provider.prefix)) {
      targetProvider = provider;
      body.model = model.replace(`${provider.prefix}-`, "");
      break;
    }
  }

  if (!targetProvider) {
    targetProvider = defaultProvider;
  }

  const targetURL = `${targetProvider.baseURL}${path}${searchParams}`;
  const proxyUrl = targetProvider.proxy ?? config.defaultProxy;

  const headers = new Headers();

  const authHeader = req.headers.get("Authorization");
  if (targetProvider.apiKey) {
    headers.set("Authorization", `Bearer ${targetProvider.apiKey}`);
  } else if (authHeader) {
    headers.set("Authorization", authHeader);
  } else {
    return Response.json({ error: "No API key provided" }, { status: 401 });
  }

  const openAIHeaders = [
    "content-type",
    "accept-encoding",
    "connection",
    "content-length",
    "accept-language",
    "sec-fetch-mode",
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
    method: req.method,
    headers,
    body: JSON.stringify(body),
    redirect: "follow",
    keepalive: true,
    credentials: "include",
    signal: AbortSignal.timeout(120 * 1000),
  };

  if (proxyUrl) {
    fetchOptions.proxy = proxyUrl;
  }

  try {
    console.info({ url: targetURL }, "fetching");
    const start = Date.now();
    const response = await fetch(targetURL, fetchOptions);
    console.info(
      { status: response.status, duration: Date.now() - start },
      "done",
    );

    const headers = new Headers(response.headers);

    if (response.headers.get("content-type") === null) {
      headers.set("content-type", "text/event-stream");
    }

    headers.set("keep-alive", "timeout=100");

    return new Response(response.body, {
      headers: headers,
      status: response.status,
    });
  } catch (error: unknown) {
    console.error({ error });
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

export const server: Deno.HttpServer<Deno.NetAddr> = Deno.serve({ port: Number(Deno.env.get("PORT") ?? 7000) }, handler);
