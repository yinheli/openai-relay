import type { Config, Provider } from "./types";

function parseProviderConfig(): Config {
  const config: Config = {
    providers: {},
    defaultProxy: process.env.RELAY_PROXY_HTTP,
  };

  // Get all provider configurations from environment variables
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('RELAY_PROVIDER_')) continue;
    if (!value) continue;
    
    const providerName = key.replace('RELAY_PROVIDER_', '').toLowerCase();
    const models = process.env[`RELAY_MODEL_${key.replace('RELAY_PROVIDER_', '')}`]?.split(',') || [];
    const proxy = process.env[`RELAY_PROXY_HTTP_${key.replace('RELAY_PROVIDER_', '')}`];

    config.providers[providerName] = {
      prefix: providerName,
      baseURL: value,
      models,
      proxy,
    };
  }

  return config;
}

export const config = parseProviderConfig();
