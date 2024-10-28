export interface Provider {
  prefix: string;
  baseURL: string;
  models: string[];
  apiKey: string;
  proxy?: string;
}

export interface Config {
  providers: Record<string, Provider>;
  defaultProxy?: string;
}
