/**
 * API client for backend requests
 */

const API_URL = import.meta.env.VITE_API_URL || '';

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
  const { body, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
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
    throw new ApiError(
      error.message || `Request failed with status ${response.status}`,
      response.status,
      error
    );
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
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
  users: {
    me: (token: string) => apiRequest<UserProfile>('/api/users/me', token),
    search: (token: string, query: string) =>
      apiRequest<UserSearchResult | null>(`/api/users/search?q=${encodeURIComponent(query)}`, token),
    update: (token: string, data: UpdateProfileData) =>
      apiRequest<UserProfile>('/api/users/me', token, {
        method: 'PUT',
        body: data,
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
    delete: (token: string, id: string) =>
      apiRequest<void>(`/api/health-status/${id}`, token, {
        method: 'DELETE',
      }),
  },
  exposures: {
    get: (token: string) =>
      apiRequest<ExposureSnapshot>('/api/exposures', token),
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
  exposures?: ExposureItem[];
  computedAt?: string;
  nextUpdateAt?: string;
  message?: string | null;
  recommendation?: string | null;
}
