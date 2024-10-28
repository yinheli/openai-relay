import { serve } from 'bun';
import { config } from './config';
import { logger } from './logger';

interface ProxyFetchOptions extends RequestInit {
  proxy?: string;
}

interface RequestBody {
  model?: string;
}

const server = serve({
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Handle health check endpoint
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 200,
      });
    }

    logger.info({ path, method: req.method, ua: req.headers.get('User-Agent') });

    // Only handle POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const searchParams = url.search; // Preserve query parameters

    // Get request body
    let body: RequestBody;
    try {
      body = await req.json();
    } catch (error) {
      logger.error({ error });
      return new Response('Invalid JSON body', { status: 400 });
    }

    // Determine provider based on model prefix
    const model = body.model;

    let targetProvider = null;
    for (const [_, provider] of Object.entries(config.providers)) {
      if (model?.startsWith(provider.prefix)) {
        targetProvider = provider;
        body.model = model.replace(`${provider.prefix}-`, '');
        break;
      }
    }

    if (!targetProvider) {
      // If no matching provider, forward to OpenAI
      targetProvider = {
        baseURL: 'https://api.openai.com',
        prefix: '',
        apiKey: process.env.OPENAI_API_KEY || '',
        models: [],
      };
    }

    const targetURL = `${targetProvider.baseURL}${path}${searchParams}`;
    const proxyUrl = targetProvider.proxy || config.defaultProxy;

    const headers = new Headers();

    const authHeader = req.headers.get('Authorization');
    if (targetProvider.apiKey) {
      headers.set('Authorization', `Bearer ${targetProvider.apiKey}`);
    } else if (authHeader) {
      headers.set('Authorization', authHeader);
    } else {
      return new Response('No API key provided', { status: 401 });
    }

    const openAIHeaders = [
      'content-type',
      'accept-encoding',
      'connection',
      'content-length',
      'accept-language',
      'sec-fetch-mode',
      'OpenAI-Organization',
      'OpenAI-Beta',
      'HTTP-Referer',
      'X-Request-ID',
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
      redirect: 'follow',
      keepalive: true,
      credentials: 'include',
      signal: AbortSignal.timeout(120 * 1000),
    };

    if (proxyUrl) {
      fetchOptions.proxy = proxyUrl;
    }

    try {
      logger.info({ url: targetURL }, 'fetching');
      const start = Date.now();
      const response = await fetch(targetURL, fetchOptions);
      logger.info({ status: response.status, duration: Date.now() - start }, 'done');

      return new Response(response.body, {
        headers: { ...response.headers, 'keep-alive': 'timeout=100' },
        status: response.status,
      });
    } catch (error: unknown) {
      logger.error({ error });
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  },
  hostname: '0.0.0.0',
  port: process.env.PORT || 7000,
  idleTimeout: 120,
});

logger.info(`listening on port ${server.port}`);
