// AI provider architecture types — mirrors the Prisma schema.
// Providers are stored in the database and registered dynamically;
// nothing here is hardcoded to a specific vendor.

export type AIAuthType = 'api_key' | 'none' | 'bearer' | 'azure';

export type AICapability = 'chat' | 'vision' | 'code' | 'embedding' | 'audio' | 'image_gen';

export interface AIProvider {
  id:        string;
  name:      string;
  slug:      string;          // stable identifier used in API calls: "openai", "anthropic"
  baseUrl:   string | null;   // required for self-hosted providers (Ollama, Azure endpoint)
  authType:  AIAuthType;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  models?:   AIModel[];
}

export interface AIModel {
  id:              string;
  providerId:      string;
  name:            string;        // display: "Claude Sonnet 4.6"
  modelId:         string;        // API value: "claude-sonnet-4-6"
  contextWindow:   number | null;
  inputCostPer1k:  number | null; // USD per 1,000 input tokens
  outputCostPer1k: number | null; // USD per 1,000 output tokens
  capabilities:    AICapability[];
  isEnabled:       boolean;
  createdAt:       string;
  updatedAt:       string;
  provider?:       AIProvider;
}

export interface AIConnection {
  id:          string;
  workspaceId: string;
  providerId:  string;
  baseUrl:     string | null;  // workspace-level endpoint override
  isActive:    boolean;
  createdAt:   string;
  updatedAt:   string;
  provider?:   AIProvider;
}

export interface AISettings {
  id:                string;
  workspaceId:       string | null;  // null = platform-global default
  defaultProviderId: string | null;
  defaultModelId:    string | null;
  temperature:       number;
  maxTokens:         number;
  createdAt:         string;
  updatedAt:         string;
}

// Shape returned by the future provider registry endpoint.
// The registry describes what each provider needs — no hardcoding required.
export interface AIProviderDescriptor {
  slug:        string;
  name:        string;
  authType:    AIAuthType;
  requiresUrl: boolean;        // true for Ollama, Azure
  docsUrl:     string;
  logoSlug:    string;         // used to load the provider logo asset
}
