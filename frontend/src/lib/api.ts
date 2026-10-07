// API client for EventPulse backend

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("eventpulse_token");
};

export const setAuthToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("eventpulse_token", token);
  }
};

export const clearAuthToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("eventpulse_token");
    localStorage.removeItem("eventpulse_user");
    localStorage.removeItem("eventpulse_project_id");
  }
};

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("eventpulse_user");
  return user ? JSON.parse(user) : null;
};

export const setStoredUser = (user: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("eventpulse_user", JSON.stringify(user));
  }
};

export const getActiveProjectId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("eventpulse_project_id");
};

export const setActiveProjectId = (id: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("eventpulse_project_id", id);
  }
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"] && !headers["X-API-Key"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errorJson = await response.json();
      errorMsg = errorJson.message || errorJson.error || errorMsg;
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: { organizationName: string; email: string; password: string }) =>
    apiFetch<{ organizationId: string; userId: string; email: string; organizationName: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { organizationId: string; email: string; password: string }) =>
    apiFetch<{ accessToken: string; tokenType: string; expiresIn: number }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () =>
    apiFetch<{ userId: string; organizationId: string; email: string }>("/api/auth/me"),

  // Projects
  getProjects: () =>
    apiFetch<Array<{ id: string; organizationId: string; name: string; createdAt: string; updatedAt: string }>>("/api/projects"),

  createProject: (data: { name: string }) =>
    apiFetch<{ id: string; organizationId: string; name: string; createdAt: string; updatedAt: string }>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteProject: (id: string) =>
    apiFetch<void>(`/api/projects/${id}`, { method: "DELETE" }),

  // API Keys
  getApiKeys: (projectId: string) =>
    apiFetch<Array<{ id: string; projectId: string; name: string; keyPrefix: string; active: boolean; createdAt: string }>>(`/api/projects/${projectId}/api-keys`),

  createApiKey: (projectId: string, data: { name: string }) =>
    apiFetch<{ id: string; projectId: string; name: string; keyPrefix: string; apiKey: string; active: boolean; createdAt: string }>(`/api/projects/${projectId}/api-keys`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  revokeApiKey: (projectId: string, keyId: string) =>
    apiFetch<void>(`/api/projects/${projectId}/api-keys/${keyId}`, { method: "DELETE" }),

  // Webhook Endpoints
  getEndpoints: (projectId: string) =>
    apiFetch<Array<{
      id: string;
      projectId: string;
      name: string;
      url: string;
      secretToken: string;
      status: string;
      circuitState: string;
      failureCount: number;
      rateLimitPerMinute: number;
      createdAt: string;
    }>>(`/api/projects/${projectId}/endpoints`),

  createEndpoint: (projectId: string, data: { name: string; url: string; rateLimitPerMinute?: number }) =>
    apiFetch<any>(`/api/projects/${projectId}/endpoints`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteEndpoint: (projectId: string, endpointId: string) =>
    apiFetch<void>(`/api/projects/${projectId}/endpoints/${endpointId}`, { method: "DELETE" }),

  resetCircuit: (projectId: string, endpointId: string) =>
    apiFetch<any>(`/api/projects/${projectId}/endpoints/${endpointId}/reset-circuit`, { method: "POST" }),

  // Events & Ingestion
  ingestEvent: (data: { eventType: string; payload: any; idempotencyKey?: string }, apiKey?: string, projectId?: string) => {
    const headers: Record<string, string> = {};
    if (apiKey) headers["X-API-Key"] = apiKey;
    const url = projectId ? `/api/v1/events?projectId=${projectId}` : "/api/v1/events";
    return apiFetch<{
      eventId: string;
      projectId: string;
      eventType: string;
      status: string;
      deliveriesCreated: number;
      idempotent: boolean;
      createdAt: string;
    }>(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
  },

  getEvents: (projectId: string) =>
    apiFetch<Array<{ id: string; projectId: string; eventType: string; payload: string; idempotencyKey?: string; status: string; createdAt: string }>>(`/api/projects/${projectId}/events`),

  getEventDeliveries: (projectId: string, eventId: string) =>
    apiFetch<Array<any>>(`/api/projects/${projectId}/events/${eventId}/deliveries`),

  getProjectDeliveries: (projectId: string) =>
    apiFetch<Array<{
      id: string;
      projectId: string;
      eventId: string;
      endpointId: string;
      status: string;
      attemptCount: number;
      maxAttempts: number;
      nextRetryAt?: string;
      lastHttpStatus?: number;
      lastError?: string;
      lastLatencyMs?: number;
      createdAt: string;
    }>>(`/api/projects/${projectId}/deliveries`),

  getDeliveryAttempts: (projectId: string, deliveryId: string) =>
    apiFetch<Array<{
      id: string;
      deliveryId: string;
      attemptNumber: number;
      httpStatus?: number;
      latencyMs?: number;
      errorMessage?: string;
      status: string;
      createdAt: string;
      responseBody?: string;
      requestBody?: string;
    }>>(`/api/projects/${projectId}/deliveries/${deliveryId}/attempts`),

  // DLQ
  getDlqEvents: (projectId: string) =>
    apiFetch<Array<{
      id: string;
      projectId: string;
      eventId: string;
      deliveryId: string;
      endpointId: string;
      reason: string;
      failedAt: string;
      status: string;
    }>>(`/api/projects/${projectId}/dlq`),

  retryDlqEvent: (projectId: string, dlqId: string) =>
    apiFetch<any>(`/api/projects/${projectId}/dlq/${dlqId}/retry`, { method: "POST" }),

  discardDlqEvent: (projectId: string, dlqId: string) =>
    apiFetch<any>(`/api/projects/${projectId}/dlq/${dlqId}`, { method: "DELETE" }),

  // Analytics
  getAnalytics: (projectId?: string) => {
    const url = projectId ? `/api/projects/${projectId}/analytics` : "/api/analytics";
    return apiFetch<{
      totalEvents: number;
      totalDeliveries: number;
      successDeliveries: number;
      failedDeliveries: number;
      retryingDeliveries: number;
      dlqCount: number;
      successRatePercent: number;
      failureRatePercent: number;
      latencyP50Ms: number;
      latencyP95Ms: number;
      latencyP99Ms: number;
      averageLatencyMs: number;
      statusBreakdown: Record<string, number>;
    }>(url);
  },

  // AI Insights
  getAiAnalysis: (projectId: string, deliveryId: string) =>
    apiFetch<{
      deliveryId: string;
      rootCauseCategory: string;
      confidenceScore: number;
      explanation: string;
      suggestedRemediation: string[];
      retryable: boolean;
      recommendedAction: string;
    }>(`/api/projects/${projectId}/deliveries/${deliveryId}/ai-analysis`),

  getAiIncidentSummary: (projectId: string) =>
    apiFetch<{
      incidentTitle: string;
      severity: string;
      impactSummary: string;
      affectedEndpoints: string[];
      commonPattern: string;
      recommendations: string[];
      circuitBreakerAdvice: string;
    }>(`/api/projects/${projectId}/ai-incident-summary`),
};
