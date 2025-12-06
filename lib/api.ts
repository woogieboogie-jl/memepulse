import { authStorage } from './auth-storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const auth = authStorage.getAuth();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    const existingHeaders = new Headers(options.headers);
    existingHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  if (auth?.token) {
    headers['Authorization'] = `Bearer ${auth.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  const result: ApiResponse<T> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Request failed');
  }

  return result.data;
}

// Auth types
export interface GetNonceResponse {
  nonce: string;
}

export interface AuthUser {
  id: string;
  walletAddress: string;
}

export interface VerifyResponse {
  token: string;
  user: AuthUser;
}

// Auth endpoints
export const authApi = {
  async getNonce(walletAddress: string): Promise<GetNonceResponse> {
    return apiFetch('/auth/message', {
      method: 'POST',
      body: JSON.stringify({ address: walletAddress }),
    });
  },

  async verify(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<VerifyResponse> {
    return apiFetch('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, message, signature }),
    });
  },
};

// User types
export interface GetMeResponse {
  id: string;
  walletAddress: string;
  orderlyAccountId: string | null;
  orderlyPublicKey?: string;
  orderlySecretKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterOrderlyKeyRequest {
  accountId: string;
  publicKey: string;
  secretKey: string;
}

export interface RegisterOrderlyKeyResponse {
  accountId: string;
  publicKey: string;
}

// User endpoints
export const userApi = {
  async getMe(): Promise<GetMeResponse> {
    return apiFetch('/me', {
      method: 'GET',
    });
  },

  async registerOrderlyKey(data: RegisterOrderlyKeyRequest): Promise<RegisterOrderlyKeyResponse> {
    return apiFetch('/me:register-orderly-key', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Trigger config types
export type TriggerConfig =
  | { type: 'timer'; intervalMs: number }
  | { type: 'twitter'; username: string };

// Agent types
export interface CreateAgentRequest {
  name: string;
  subAccountId: string;
  symbol: string;
  mode?: string;
  trigger?: TriggerConfig;
  context?: string;
  strategy?: string;
}

export interface AgentResponse {
  id: string;
  userId: string;
  subAccountId: string;
  symbol: string;
  status: string;
  name?: string;
  strategy?: string;
  context?: string;
  trigger?: TriggerConfig;
  mode?: string;
  lastHeartbeatAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Decision Log types
export interface DecisionLogResponse {
  id: string;
  agentId: string;
  action: string;
  reason: string;
  symbol: string;
  price: number;
  pnl: number | null;
  createdAt: string;
}

export interface DecisionLogsResponse {
  logs: DecisionLogResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Agent endpoints
export const agentApi = {
  async create(config: CreateAgentRequest): Promise<AgentResponse> {
    return apiFetch('/agents', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  async list(): Promise<AgentResponse[]> {
    return apiFetch('/agents', {
      method: 'GET',
    });
  },

  async get(id: string): Promise<AgentResponse> {
    return apiFetch(`/agents/${id}`, {
      method: 'GET',
    });
  },

  async start(id: string): Promise<AgentResponse> {
    return apiFetch(`/agents/${id}/start`, {
      method: 'POST',
    });
  },

  async stop(id: string): Promise<AgentResponse> {
    return apiFetch(`/agents/${id}/stop`, {
      method: 'POST',
    });
  },

  async delete(id: string): Promise<{ id: string }> {
    return apiFetch(`/agents/${id}`, {
      method: 'DELETE',
    });
  },

  async getDecisionLogs(id: string, cursor?: string, limit: number = 20): Promise<DecisionLogsResponse> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (cursor) {
      params.append('cursor', cursor);
    }
    return apiFetch(`/agents/${id}/decisions?${params.toString()}`, {
      method: 'GET',
    });
  },
};
