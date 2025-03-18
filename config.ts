import type { Config } from "./types.ts";

function parseProviderConfig(): Config {
  const config: Config = {
    providers: {},
    defaultProxy: Deno.env.get("RELAY_PROXY_HTTP"),
  };

  // Get all provider configurations from environment variables
  for (const [key, value] of Object.entries(Deno.env.toObject())) {
    if (!key.startsWith("RELAY_PROVIDER_")) continue;
    if (!value) continue;

    const providerName = key.replace("RELAY_PROVIDER_", "").toLowerCase();
    const models = Deno.env.get(`RELAY_MODEL_${key.replace("RELAY_PROVIDER_", "")}`)?.split(
      ",",
    ) || [];
    const apiKey = Deno.env.get(
      `RELAY_API_KEY_${key.replace("RELAY_PROVIDER_", "")}`,
    );
    const proxy = Deno.env.get(
      `RELAY_PROXY_HTTP_${key.replace("RELAY_PROVIDER_", "")}`,
    );

    config.providers[providerName] = {
      prefix: providerName,
      baseURL: value,
      models,
      apiKey: apiKey ?? "",
      proxy,
    };
  }

  return config;
}

export const config = parseProviderConfig();
