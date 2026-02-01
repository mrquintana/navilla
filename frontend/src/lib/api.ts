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
    update: (token: string, data: UpdateProfileData) =>
      apiRequest<UserProfile>('/api/users/me', token, {
        method: 'PUT',
        body: data,
      }),
  },
  connections: {
    list: (token: string) =>
      apiRequest<Connection[]>('/api/connections', token),
    create: (token: string, partnerEmail: string) =>
      apiRequest<Connection>('/api/connections', token, {
        method: 'POST',
        body: { partnerEmailHash: partnerEmail },
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
};

// Types
export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface UpdateProfileData {
  display_name?: string;
}

export interface Connection {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'DENIED' | 'EXPIRED';
  created_at: string;
  updated_at: string;
}

export interface ConnectionStats {
  total: number;
  confirmed: number;
  pending: number;
}
