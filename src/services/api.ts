/**
 * ResearchPulse AI Client API Service
 */

const API_BASE = '/api/v1';

export function getStoredToken(): string | null {
  return localStorage.getItem('researchpulse_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('researchpulse_token', token);
}

export function removeStoredToken(): void {
  localStorage.removeItem('researchpulse_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      errorMsg = errJson.error || errJson.message || errorMsg;
      if (errJson.details && Array.isArray(errJson.details)) {
        errorMsg += ': ' + errJson.details.map((d: any) => d.message).join(', ');
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  // Return json or blob depending on content-type
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text() as unknown as T;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (data: { email: string; password: string; fullName: string }) =>
      apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    demoLogin: () => apiRequest('/auth/demo-login', { method: 'POST' }),
    me: () => apiRequest('/auth/me'),
  },

  // Workspaces
  workspaces: {
    list: () => apiRequest('/workspaces'),
    get: (id: string) => apiRequest(`/workspaces/${id}`),
    create: (data: { name: string; description?: string; domain?: string }) =>
      apiRequest('/workspaces', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest(`/workspaces/${id}`, { method: 'DELETE' }),
    uploadDocument: (workspaceId: string, formData: FormData) =>
      apiRequest(`/workspaces/${workspaceId}/documents`, { method: 'POST', body: formData }),
    getDocuments: (workspaceId: string) => apiRequest(`/workspaces/${workspaceId}/documents`),
  },

  // Documents
  documents: {
    listAll: () => apiRequest('/documents'),
    getChunks: (id: string) => apiRequest(`/documents/${id}/chunks`),
    delete: (id: string) => apiRequest(`/documents/${id}`, { method: 'DELETE' }),
  },

  // Discovery / Hybrid Search
  discovery: {
    search: (params: {
      workspaceId: string;
      query: string;
      topK?: number;
      documentIds?: string[];
    }) => apiRequest('/discovery/search', { method: 'POST', body: JSON.stringify(params) }),
  },

  // Synthesis & Chat Stream
  synthesis: {
    listSessions: (workspaceId: string) => apiRequest(`/synthesis/sessions?workspaceId=${workspaceId}`),
    getSessionMessages: (sessionId: string) => apiRequest(`/synthesis/sessions/${sessionId}/messages`),
    generateReview: (params: {
      workspaceId: string;
      documentIds: string[];
      researchQuestion: string;
      depth?: 'executive' | 'critical' | 'exhaustive';
    }) => apiRequest('/synthesis/review', { method: 'POST', body: JSON.stringify(params) }),
  },

  // Extractions
  extractions: {
    list: (workspaceId?: string) =>
      apiRequest(`/extractions${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),
    process: (params: { workspaceId: string; documentId: string }) =>
      apiRequest('/extractions/process', { method: 'POST', body: JSON.stringify(params) }),
    exportCsvUrl: (workspaceId?: string) =>
      `${API_BASE}/extractions/export?format=csv${workspaceId ? `&workspaceId=${workspaceId}` : ''}`,
  },

  // Analytics & Dashboard
  analytics: {
    getDashboard: () => apiRequest('/analytics/dashboard'),
    getSettings: () => apiRequest('/analytics/settings'),
  },
};
