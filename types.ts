export interface Provider {
  prefix: string;
  baseURL: string;
  models: string[];
  proxy?: string;
}

export interface Config {
  providers: Record<string, Provider>;
  defaultProxy?: string;
}
