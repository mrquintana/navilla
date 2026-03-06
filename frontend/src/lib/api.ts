/**
 * API client for backend requests
 */

import { E2E_MODE, getE2eUserFromToken, type E2eUser } from './e2eMocks';
import { env } from './env';
import type { ReciprocityStatus } from '../types/reciprocity';
import type { ConditionCatalogItem, NetworkStage } from '../types/catalog';
import type { PhoneMatchNotification } from '../types/phoneMatch';
import type { LabProviderConfig, LabVerifyRequest, LabVerifyResponse, LabConfirmRequest } from '../types/lab';

const RAW_API_URL = env.get('VITE_API_URL') ?? '';
const NORMALIZED_API_URL = RAW_API_URL.replace(/\/+$/, '');
const DEFAULT_DEV_API_URL = 'http://localhost:8080';

export const API_URL = NORMALIZED_API_URL || (env.DEV ? DEFAULT_DEV_API_URL : '');

function getApiBaseUrl(): string {
  if (API_URL) {
    return API_URL;
  }
  if (env.DEV) {
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

  if (endpoint === '/api/reciprocity/status') {
    return Promise.resolve({ optedIn: false, optedInAt: null, optedOutAt: null, cooldownDaysRemaining: null } as T);
  }

  if (endpoint === '/api/reciprocity/opt-in' || endpoint === '/api/reciprocity/opt-out') {
    return Promise.resolve({ optedIn: false, optedInAt: null, optedOutAt: null, cooldownDaysRemaining: null } as T);
  }

  if (endpoint === '/api/phone-match/pending') {
    return Promise.resolve([] as T);
  }

  if (endpoint.startsWith('/api/journal/templates')) return Promise.resolve({ labels: [] } as T);
  if (endpoint.startsWith('/api/journal/summary')) return Promise.resolve({ year: 2026, monthlyCounts: {}, yearTotal: 0 } as T);
  if (endpoint === '/api/journal' && (!options || options.method === undefined || options.method === 'GET')) return Promise.resolve([] as T);

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

// Journal types
export interface CustomField {
  label: string;
  value: string;
}

export interface JournalEntry {
  id: string;
  encounterDate: string;
  partnerAlias: string | null;
  connectionId: string | null;
  connectionDisplayName: string | null;
  partnerId: string | null;
  partnerEncounterCount: number | null;
  notes: string | null;
  customFields: CustomField[] | null;
  encounterTypes: string[] | null;
  protectionMethods: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalEntryRequest {
  encounterDate: string;
  partnerAlias?: string;
  connectionId?: string;
  partnerId?: string;
  phone?: string;
  notes?: string;
  customFields?: CustomField[];
  encounterTypes?: string[];
  protectionMethods?: string[];
}

export interface UpdateJournalEntryRequest {
  encounterDate: string;
  partnerAlias?: string;
  connectionId?: string;
  partnerId?: string;
  phone?: string;
  notes?: string;
  customFields?: CustomField[];
  encounterTypes?: string[];
  protectionMethods?: string[];
}

export interface JournalSummary {
  year: number;
  monthlyCounts: Record<string, number>;
  yearTotal: number;
}

export interface JournalTemplates {
  labels: string[];
}

export interface JournalPartner {
  id: string;
  alias: string;
  connectionId: string | null;
  connectionDisplayName: string | null;
  encounterCount: number;
  firstEncounterDate: string | null;
  mostRecentEncounterDate: string | null;
}

export interface JournalPartnerDetail extends JournalPartner {
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerRequest {
  alias: string;
  connectionId?: string;
  notes?: string;
}

export interface UpdatePartnerRequest {
  alias?: string;
  connectionId?: string;
  notes?: string;
  unlinkConnection?: boolean;
}

export interface PromoteAliasRequest {
  alias: string;
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
      if (env.DEV) {
        console.debug('[healthcheck] url', `${baseUrl}/api/health`);
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(`${baseUrl}/api/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (env.DEV) {
          console.debug('[healthcheck] response', response.status);
        }
        if (!response.ok) {
          throw new Error('Health check failed');
        }
        return response.json();
      } catch (error) {
        if (env.DEV) {
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
    markAllRead: (token: string) =>
      apiRequest<void>('/api/notifications/read-all', token, {
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
  journal: {
    list: (token: string, month?: string) =>
      apiRequest<JournalEntry[]>(month ? `/api/journal?month=${month}` : '/api/journal', token),
    create: (token: string, data: CreateJournalEntryRequest) =>
      apiRequest<JournalEntry>('/api/journal', token, { method: 'POST', body: data }),
    update: (token: string, id: string, data: UpdateJournalEntryRequest) =>
      apiRequest<JournalEntry>(`/api/journal/${id}`, token, { method: 'PUT', body: data }),
    delete: (token: string, id: string) =>
      apiRequest<void>(`/api/journal/${id}`, token, { method: 'DELETE' }),
    summary: (token: string, year: number) =>
      apiRequest<JournalSummary>(`/api/journal/summary?year=${year}`, token),
    templates: {
      get: (token: string) =>
        apiRequest<JournalTemplates>('/api/journal/templates', token),
      save: (token: string, labels: string[]) =>
        apiRequest<JournalTemplates>('/api/journal/templates', token, { method: 'PUT', body: { labels } }),
    },
    partners: {
      list: (token: string) =>
        apiRequest<JournalPartner[]>('/api/journal/partners', token),
      create: (token: string, data: CreatePartnerRequest) =>
        apiRequest<JournalPartner>('/api/journal/partners', token, { method: 'POST', body: data }),
      get: (token: string, id: string) =>
        apiRequest<JournalPartnerDetail>(`/api/journal/partners/${id}`, token),
      update: (token: string, id: string, data: UpdatePartnerRequest) =>
        apiRequest<JournalPartner>(`/api/journal/partners/${id}`, token, { method: 'PUT', body: data }),
      delete: (token: string, id: string, deleteEntries = false) =>
        apiRequest<void>(`/api/journal/partners/${id}?deleteEntries=${deleteEntries}`, token, { method: 'DELETE' }),
      entries: (token: string, id: string) =>
        apiRequest<JournalEntry[]>(`/api/journal/partners/${id}/entries`, token),
      promote: (token: string, data: PromoteAliasRequest) =>
        apiRequest<JournalPartner>('/api/journal/partners/promote', token, { method: 'POST', body: data }),
    },
    recentAliases: (token: string) =>
      apiRequest<string[]>('/api/journal/recent-aliases', token),
  },
  healthLog: {
    visits: {
      list: (token: string) =>
        apiRequest<TestVisit[]>('/api/health-log/visits', token),
      create: (token: string, data: CreateTestVisitRequest) =>
        apiRequest<TestVisit>('/api/health-log/visits', token, { method: 'POST', body: data }),
      get: (token: string, id: string) =>
        apiRequest<TestVisit>(`/api/health-log/visits/${id}`, token),
      update: (token: string, id: string, data: UpdateTestVisitRequest) =>
        apiRequest<TestVisit>(`/api/health-log/visits/${id}`, token, { method: 'PUT', body: data }),
      delete: (token: string, id: string) =>
        apiRequest<void>(`/api/health-log/visits/${id}`, token, { method: 'DELETE' }),
    },
    summary: (token: string) =>
      apiRequest<HealthLogSummary>('/api/health-log/summary', token),
    condition: (token: string, type: string) =>
      apiRequest<ConditionHistory>(`/api/health-log/condition/${type}`, token),
    labs: {
      list: (token: string) =>
        apiRequest<Lab[]>('/api/health-log/labs', token),
      create: (token: string, data: CreateLabRequest) =>
        apiRequest<Lab>('/api/health-log/labs', token, { method: 'POST', body: data }),
      update: (token: string, id: string, data: UpdateLabRequest) =>
        apiRequest<Lab>(`/api/health-log/labs/${id}`, token, { method: 'PUT', body: data }),
      delete: (token: string, id: string) =>
        apiRequest<void>(`/api/health-log/labs/${id}`, token, { method: 'DELETE' }),
    },
  },
  catalog: {
    get: async (): Promise<CatalogResponse> => {
      if (E2E_MODE) {
        return { medicationTypes: {}, frequencies: {}, vaccineSeries: {}, encounterTypes: [], protectionMethods: [] };
      }
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/catalog`, { method: 'GET' });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(error.message || 'Failed to fetch catalog', response.status, error);
      }
      return response.json();
    },
    conditions: async (): Promise<ConditionCatalogItem[]> => {
      if (E2E_MODE) {
        return [];
      }
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/catalog/conditions`, { method: 'GET' });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(error.message || 'Failed to fetch conditions catalog', response.status, error);
      }
      return response.json();
    },
    stages: async (): Promise<NetworkStage[]> => {
      if (E2E_MODE) {
        return [];
      }
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/catalog/stages`, { method: 'GET' });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(error.message || 'Failed to fetch network stages', response.status, error);
      }
      return response.json();
    },
  },
  medications: {
    list: (token: string) =>
      apiRequest<Medication[]>('/api/medications', token),
    create: (token: string, data: CreateMedicationRequest) =>
      apiRequest<Medication>('/api/medications', token, { method: 'POST', body: data }),
    get: (token: string, id: string) =>
      apiRequest<Medication>(`/api/medications/${id}`, token),
    update: (token: string, id: string, data: UpdateMedicationRequest) =>
      apiRequest<Medication>(`/api/medications/${id}`, token, { method: 'PUT', body: data }),
    delete: (token: string, id: string) =>
      apiRequest<void>(`/api/medications/${id}`, token, { method: 'DELETE' }),
    logDose: (token: string, id: string, data: LogDoseRequest) =>
      apiRequest<DoseLogEntry>(`/api/medications/${id}/doses`, token, { method: 'POST', body: data }),
    adherence: (token: string, id: string, month: string) =>
      apiRequest<MedicationAdherence>(`/api/medications/${id}/adherence?month=${month}`, token),
    prepStreak: (token: string) =>
      apiRequest<PrepStreak>('/api/medications/prep-streak', token),
  },
  vaccinations: {
    list: (token: string) =>
      apiRequest<VaccineSeries[]>('/api/vaccinations', token),
    create: (token: string, data: CreateVaccinationRequest) =>
      apiRequest<VaccinationDose>('/api/vaccinations', token, { method: 'POST', body: data }),
    update: (token: string, id: string, data: UpdateVaccinationRequest) =>
      apiRequest<VaccinationDose>(`/api/vaccinations/${id}`, token, { method: 'PUT', body: data }),
    delete: (token: string, id: string) =>
      apiRequest<void>(`/api/vaccinations/${id}`, token, { method: 'DELETE' }),
  },
  reminders: {
    list: (token: string) =>
      apiRequest<Reminder[]>('/api/reminders', token),
    upcoming: (token: string, days: number) =>
      apiRequest<Reminder[]>(`/api/reminders/upcoming?days=${days}`, token),
    snooze: (token: string, id: string, until: string) =>
      apiRequest<Reminder>(`/api/reminders/${id}/snooze`, token, { method: 'POST', body: { until } }),
    complete: (token: string, id: string) =>
      apiRequest<Reminder>(`/api/reminders/${id}/complete`, token, { method: 'POST' }),
    toggle: (token: string, id: string) =>
      apiRequest<Reminder>(`/api/reminders/${id}/toggle`, token, { method: 'POST' }),
    delete: (token: string, id: string) =>
      apiRequest<void>(`/api/reminders/${id}`, token, { method: 'DELETE' }),
    settings: {
      get: (token: string) =>
        apiRequest<ReminderSettings>('/api/reminders/settings', token),
      update: (token: string, data: UpdateReminderSettingsRequest) =>
        apiRequest<ReminderSettings>('/api/reminders/settings', token, { method: 'PUT', body: data }),
    },
  },
  insights: {
    get: (token: string) =>
      apiRequest<InsightsResponse>('/api/insights', token),
  },
  push: {
    vapidPublicKey: async () => {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/push/vapid-public-key`);
      if (!res.ok) throw new Error('Failed to fetch VAPID key');
      const data: { publicKey: string } = await res.json();
      return data.publicKey;
    },
    subscribe: (token: string, data: PushSubscriptionData) =>
      apiRequest<PushSubscriptionItem>('/api/push/subscribe', token, { method: 'POST', body: data }),
    unsubscribe: (token: string, id: string) =>
      apiRequest<void>(`/api/push/subscriptions/${id}`, token, { method: 'DELETE' }),
    list: (token: string) =>
      apiRequest<PushSubscriptionItem[]>('/api/push/subscriptions', token),
  },
  reciprocity: {
    status: (token: string) =>
      apiRequest<ReciprocityStatus>('/api/reciprocity/status', token),
    optIn: (token: string) =>
      apiRequest<ReciprocityStatus>('/api/reciprocity/opt-in', token, { method: 'POST' }),
    optOut: (token: string) =>
      apiRequest<ReciprocityStatus>('/api/reciprocity/opt-out', token, { method: 'POST' }),
  },
  labs: {
    providers: (token: string) =>
      apiRequest<LabProviderConfig[]>('/api/labs/providers', token, { method: 'GET' }),
    verify: (token: string, data: LabVerifyRequest) =>
      apiRequest<LabVerifyResponse>('/api/labs/verify', token, { method: 'POST', body: data }),
    confirm: (token: string, data: LabConfirmRequest) =>
      apiRequest<{ success: boolean }>('/api/labs/confirm', token, { method: 'POST', body: data }),
  },
  phoneMatch: {
    pending: (token: string) =>
      apiRequest<PhoneMatchNotification[]>('/api/phone-match/pending', token),
    confirm: (token: string, entryId: string) =>
      apiRequest<void>(`/api/phone-match/${entryId}/confirm`, token, { method: 'POST' }),
    deny: (token: string, entryId: string) =>
      apiRequest<void>(`/api/phone-match/${entryId}/deny`, token, { method: 'POST' }),
    block: (token: string, body: { phoneHash: string }) =>
      apiRequest<void>('/api/phone-match/block', token, { method: 'POST', body }),
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

// Health Log types
export interface TestVisitResult {
  id: string;
  conditionType: string | null;
  customCondition: string | null;
  status: string;
  resultValue: string | null;
  referenceRange: string | null;
  clearedAt: string | null;
}

export interface TestVisit {
  id: string;
  testDate: string;
  labId: string | null;
  labName: string | null;
  labProvider: string | null;
  labReference: string | null;
  notes: string | null;
  verified: boolean;
  verifiedAt: string | null;
  results: TestVisitResult[];
  createdAt: string;
  updatedAt: string;
}

export interface TestResultInput {
  conditionType?: string;
  customCondition?: string;
  status: string;
  resultValue?: string;
  referenceRange?: string;
}

export interface CreateTestVisitRequest {
  testDate: string;
  labId?: string;
  labReference?: string;
  results: TestResultInput[];
  notes?: string;
}

export interface UpdateTestVisitRequest {
  testDate?: string;
  labId?: string;
  labReference?: string;
  results?: TestResultInput[];
  notes?: string;
}

export interface ConditionSummary {
  conditionType: string | null;
  customCondition: string | null;
  latestStatus: string;
  latestResultValue: string | null;
  lastTestDate: string;
  totalTests: number;
  hasPositive: boolean;
}

export interface HealthLogSummary {
  daysSinceLastTest: number;
  testsThisYear: number;
  conditionsCovered: number;
  totalStandardConditions: number;
  conditions: ConditionSummary[];
}

export interface ConditionHistoryEntry {
  visitId: string;
  testDate: string;
  status: string;
  resultValue: string | null;
  referenceRange: string | null;
  labName: string | null;
  labProvider: string | null;
  verified: boolean;
  clearedAt: string | null;
}

export interface ConditionHistory {
  conditionType: string;
  latestStatus: string;
  totalTests: number;
  lastTestDate: string;
  entries: ConditionHistoryEntry[];
}

export interface Lab {
  id: string;
  provider: string;
  name: string;
  credentials: LabCredential[];
  createdAt: string;
}

export interface LabCredential {
  key: string;
  value: string;
}

export interface CreateLabRequest {
  provider: string;
  name: string;
  credentials?: LabCredential[];
}

export interface UpdateLabRequest {
  name?: string;
  credentials?: LabCredential[];
}

// ── Catalog ──
export interface CatalogResponse {
  medicationTypes: Record<string, { labelKey: string; defaultFrequency: string; ongoing: boolean }>;
  frequencies: Record<string, { hours?: number; days?: number }>;
  vaccineSeries: Record<string, { labelKey: string; totalDoses: number; doseIntervalsDays: number[] }>;
  encounterTypes: string[];
  protectionMethods: string[];
}

// ── Medications ──
export interface Medication {
  id: string;
  medicationType: string;
  name: string;
  dosage: string | null;
  startDate: string;
  endDate: string | null;
  frequency: string;
  reminderTime: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicationRequest {
  medicationType: string;
  name: string;
  dosage?: string;
  startDate: string;
  endDate?: string;
  frequency: string;
  reminderTime?: string;
  notes?: string;
}

export interface UpdateMedicationRequest extends Partial<CreateMedicationRequest> {
  active?: boolean;
}

export interface LogDoseRequest {
  scheduledFor: string;
  taken: boolean;
  notes?: string;
}

export interface DoseLogEntry {
  id: string;
  scheduledFor: string;
  taken: boolean;
  loggedAt: string;
  notes: string | null;
}

export interface MedicationAdherence {
  month: string;
  totalDays: number;
  takenCount: number;
  missedCount: number;
  adherenceRate: number;
  logs: DoseLogEntry[];
}

export interface PrepStreakMilestone {
  days: number;
  labelKey: string;
  achieved: boolean;
}

export interface PrepStreak {
  currentStreakDays: number;
  longestStreakDays: number;
  milestones: PrepStreakMilestone[];
}

// ── Vaccinations ──
export interface VaccinationDose {
  id: string;
  vaccineType: string;
  doseNumber: number;
  totalDoses: number;
  administeredDate: string;
  location: string | null;
  notes: string | null;
  createdAt: string;
}

export interface VaccineSeries {
  vaccineType: string;
  labelKey: string;
  totalDoses: number;
  completedDoses: number;
  complete: boolean;
  nextDoseDate: string | null;
  doses: VaccinationDose[];
}

export interface CreateVaccinationRequest {
  vaccineType: string;
  doseNumber: number;
  administeredDate: string;
  location?: string;
  notes?: string;
}

export type UpdateVaccinationRequest = Partial<CreateVaccinationRequest>;

// ── Reminders ──
export interface Reminder {
  id: string;
  reminderType: string;
  referenceId: string | null;
  title: string;
  message: string | null;
  scheduledFor: string;
  repeatRule: string | null;
  snoozedUntil: string | null;
  completedAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface ReminderSettings {
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  emailDigestEnabled: boolean;
  emailDigestDay: string | null;
  testingRemindersEnabled: boolean;
  medicationRemindersEnabled: boolean;
  vaccinationRemindersEnabled: boolean;
}

export type UpdateReminderSettingsRequest = Partial<ReminderSettings>;

// ── Insights ──
export interface InsightsActivity {
  totalEncounters: number;
  encountersThisMonth: number;
  encountersByMonth: Record<string, number>;
  protectionRate: number;
  encounterTypeCounts: Record<string, number>;
  protectionMethodCounts: Record<string, number>;
}

export interface InsightsTesting {
  daysSinceLastTest: number;
  testsThisYear: number;
  conditionsCovered: number;
  totalStandardConditions: number;
  lastTestDate: string | null;
  coverageMap: Record<string, string>;
}

export interface InsightsPrevention {
  prepAdherenceRate: number | null;
  currentPrepStreakDays: number;
  longestPrepStreakDays: number;
  completedVaccines: string[];
  pendingVaccines: string[];
  activeReminders: number;
}

export interface InsightsResponse {
  activity: InsightsActivity;
  testing: InsightsTesting;
  prevention: InsightsPrevention;
}

// ── Push Subscriptions ──
export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionItem {
  id: string;
  createdAt: string;
}
