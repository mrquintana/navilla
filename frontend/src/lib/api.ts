/**
 * API client for backend requests
 */

import { E2E_MODE, getE2eUserFromToken, type E2eUser } from './e2eMocks';

const RAW_API_URL = import.meta.env.VITE_API_URL ?? '';
const NORMALIZED_API_URL = RAW_API_URL.replace(/\/+$/, '');
const DEFAULT_DEV_API_URL = 'http://localhost:8080';

export const API_URL = NORMALIZED_API_URL || (import.meta.env.DEV ? DEFAULT_DEV_API_URL : '');

function getApiBaseUrl(): string {
  if (API_URL) {
    return API_URL;
  }
  if (import.meta.env.DEV) {
    return DEFAULT_DEV_API_URL;
  }
  throw new Error('API URL is not configured. Set VITE_API_URL.');
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * Make an authenticated API request to the backend
 */
export async function apiRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestOptions = {}
): Promise<T> {
  if (E2E_MODE) {
    return mockApiRequest<T>(endpoint, accessToken, options);
  }

  const { body, headers, ...rest } = options;
  const baseUrl = getApiBaseUrl();

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, error);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function mockApiRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestOptions
): Promise<T> {
  const user = getE2eUserFromToken(accessToken);
  if (!user) {
    return Promise.reject(new ApiError('Unauthorized', 401));
  }

  if (endpoint === '/api/users/me' && options.method === 'DELETE') {
    return Promise.resolve(undefined as T);
  }

  if (endpoint === '/api/users/me' && options.method === 'PUT') {
    return Promise.resolve(mockUserProfile(user) as T);
  }

  if (endpoint === '/api/users/me') {
    return Promise.resolve(mockUserProfile(user) as T);
  }

  if (endpoint.startsWith('/api/users/search')) {
    return Promise.resolve(null as T);
  }

  if (endpoint === '/api/connections/stats') {
    return Promise.resolve({
      confirmedCount: user.confirmedCount,
      pendingIncomingCount: 0,
      pendingSentCount: 0,
    } as T);
  }

  if (endpoint.startsWith('/api/connections')) {
    return Promise.resolve([] as T);
  }

  if (endpoint === '/api/exposures') {
    return Promise.resolve({ message: null } as T);
  }

  if (endpoint.startsWith('/api/health-status')) {
    return Promise.resolve([] as T);
  }

  if (endpoint.startsWith('/api/notifications')) {
    return Promise.resolve([] as T);
  }

  return Promise.reject(new ApiError(`Unhandled E2E endpoint: ${endpoint}`, 500));
}

function mockUserProfile(user: E2eUser): UserProfile {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    fullName: user.displayName,
    username: user.username,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * API endpoints helper
 */
export const api = {
  system: {
    check: async () => {
      if (E2E_MODE) {
        return { status: 'ok' };
      }
      const baseUrl = getApiBaseUrl();
      if (import.meta.env.DEV) {
        console.debug('[healthcheck] url', `${baseUrl}/api/health`);
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(`${baseUrl}/api/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (import.meta.env.DEV) {
          console.debug('[healthcheck] response', response.status);
        }
        if (!response.ok) {
          throw new Error('Health check failed');
        }
        return response.json();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.debug('[healthcheck] error', error);
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    },
  },
  users: {
    me: (token: string) => apiRequest<UserProfile>('/api/users/me', token),
    search: (token: string, query: string) =>
      apiRequest<UserSearchResult | null>(`/api/users/search?q=${encodeURIComponent(query)}`, token),
    update: (token: string, data: UpdateProfileData) =>
      apiRequest<UserProfile>('/api/users/me', token, {
        method: 'PUT',
        body: data,
      }),
    delete: (token: string) =>
      apiRequest<void>('/api/users/me', token, {
        method: 'DELETE',
      }),
  },
  connections: {
    list: (token: string) =>
      apiRequest<Connection[]>('/api/connections', token),
    confirmed: (token: string) =>
      apiRequest<Connection[]>('/api/connections/confirmed', token),
    pendingIncoming: (token: string) =>
      apiRequest<Connection[]>('/api/connections/pending/incoming', token),
    pendingSent: (token: string) =>
      apiRequest<Connection[]>('/api/connections/pending/sent', token),
    create: (token: string, partnerEmail: string) =>
      apiRequest<ConnectionRequestResponse>('/api/connections', token, {
        method: 'POST',
        body: { identifier: partnerEmail },
      }),
    accept: (token: string, id: string) =>
      apiRequest<Connection>(`/api/connections/${id}/accept`, token, {
        method: 'POST',
      }),
    deny: (token: string, id: string) =>
      apiRequest<Connection>(`/api/connections/${id}/deny`, token, {
        method: 'POST',
      }),
    delete: (token: string, id: string) =>
      apiRequest<void>(`/api/connections/${id}`, token, {
        method: 'DELETE',
      }),
    stats: (token: string) =>
      apiRequest<ConnectionStats>('/api/connections/stats', token),
  },
  notifications: {
    list: (token: string) =>
      apiRequest<NotificationItem[]>('/api/notifications', token),
    markRead: (token: string, id: string) =>
      apiRequest<void>(`/api/notifications/${id}/read`, token, {
        method: 'POST',
      }),
  },
  health: {
    list: (token: string) =>
      apiRequest<HealthStatus[]>('/api/health-status', token),
    report: (token: string, data: HealthStatusRequest) =>
      apiRequest<HealthStatus>('/api/health-status', token, {
        method: 'POST',
        body: data,
      }),
    clear: (token: string, id: string, data?: ClearHealthStatusRequest) =>
      apiRequest<HealthStatus>(`/api/health-status/${id}/clear`, token, {
        method: 'POST',
        body: data,
      }),
    activate: (token: string, id: string) =>
      apiRequest<HealthStatus>(`/api/health-status/${id}/activate`, token, {
        method: 'POST',
      }),
    delete: (token: string, id: string) =>
      apiRequest<void>(`/api/health-status/${id}`, token, {
        method: 'DELETE',
      }),
  },
  exposures: {
    get: (token: string) =>
      apiRequest<ExposureSnapshot>('/api/exposures', token),
    recompute: (token: string) =>
      apiRequest<ExposureSnapshot>('/api/exposures/recompute', token, {
        method: 'POST',
      }),
  },
};

// Types
export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  fullName?: string;
  username?: string;
  sex?: string;
  dateOfBirth?: string;
  age?: number;
  showAge?: boolean;
  country?: string;
  location?: string;
  profileVisibility?: string;
  displayNamePublic?: boolean;
  searchableByEmail?: boolean;
  avatarUrl?: string;
  avatarThumbUrl?: string;
  createdAt: string;
}

export interface UpdateProfileData {
  displayName?: string;
  fullName?: string;
  username?: string;
  sex?: string;
  dateOfBirth?: string;
  showAge?: boolean;
  country?: string;
  location?: string;
  profileVisibility?: string;
  displayNamePublic?: boolean;
  searchableByEmail?: boolean;
  avatarKey?: string;
  avatarThumbKey?: string;
}

export interface Connection {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'DENIED' | 'EXPIRED';
  isRequester: boolean;
  requestedAt: string;
  confirmedAt?: string | null;
  partnerDisplayName?: string | null;
  partnerUsername?: string | null;
  partnerAvatarThumbUrl?: string | null;
}

export interface ConnectionRequestResponse {
  message: string;
}

export interface ConnectionStats {
  confirmedCount: number;
  pendingIncomingCount: number;
  pendingSentCount: number;
}

export interface UserSearchResult {
  username: string;
  displayName?: string | null;
  avatarThumbUrl?: string | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  messageKey: string;
  connectionId?: string | null;
  createdAt: string;
  readAt?: string | null;
}

export interface HealthStatus {
  id: string;
  condition: string;
  status: string;
  testDate?: string | null;
  reportedAt: string;
  clearedAt?: string | null;
}

export interface HealthStatusRequest {
  condition: string;
  status: string;
  testDate?: string;
}

export interface ClearHealthStatusRequest {
  clearedDate?: string;
}

export interface ExposureItem {
  condition: string;
  count: number;
  closestDegree: number;
  timeframe: string;
  status: string;
}

export interface ExposureSnapshot {
  connectionCount?: number;
  secondDegreeCount?: number | null;
  thirdDegreeCount?: number | null;
  totalGraphNodes?: number | null;
  maxDepth?: number | null;
  exposures?: ExposureItem[];
  computedAt?: string;
  nextUpdateAt?: string;
  message?: string | null;
  recommendation?: string | null;
}
