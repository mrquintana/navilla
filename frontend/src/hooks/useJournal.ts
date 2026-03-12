import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
  api,
  type JournalEntry,
  type CreateJournalEntryRequest,
  type UpdateJournalEntryRequest,
  type JournalSummary,
  type JournalTemplates,
  type JournalPartner,
  type JournalPartnerDetail,
  type CreatePartnerRequest,
  type UpdatePartnerRequest,
  type PromoteAliasRequest,
  type PageResponse,
} from '../lib/api';

export type {
  JournalEntry,
  CreateJournalEntryRequest,
  UpdateJournalEntryRequest,
  JournalSummary,
  JournalTemplates,
  JournalPartner,
  JournalPartnerDetail,
  CreatePartnerRequest,
  UpdatePartnerRequest,
  PromoteAliasRequest,
  PageResponse,
};

export function useJournalEntries(month?: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'list', month ?? 'all'],
    queryFn: () => api.journal.list(session!.access_token, month),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000,
  });
}

export function useJournalMonths() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'months'],
    queryFn: () => api.journal.months(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 60_000,
  });
}

export function useJournalEntriesPaginated(page: number, size: number = 20) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'list', 'page', page, size],
    queryFn: () => api.journal.listPaginated(session!.access_token, page, size),
    enabled: !!session?.access_token,
    placeholderData: (prev) => prev,
  });
}

export function useJournalSummary(year: number) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'summary', year],
    queryFn: () => api.journal.summary(session!.access_token, year),
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useJournalTemplates() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'templates'],
    queryFn: () => api.journal.templates.get(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateJournalEntry() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateJournalEntryRequest) =>
      api.journal.create(session!.access_token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export function useUpdateJournalEntry() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJournalEntryRequest }) =>
      api.journal.update(session!.access_token, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export function useDeleteJournalEntry() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.journal.delete(session!.access_token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export function useSaveJournalTemplates() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (labels: string[]) =>
      api.journal.templates.save(session!.access_token, labels),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal', 'templates'] });
    },
  });
}

export function useJournalPartners() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'partners'],
    queryFn: () => api.journal.partners.list(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000,
  });
}

export function useJournalPartner(id: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'partner', id],
    queryFn: () => api.journal.partners.get(session!.access_token, id),
    enabled: !!session?.access_token && !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useJournalPartnerEntries(partnerId: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'partner', partnerId, 'entries'],
    queryFn: () => api.journal.partners.entries(session!.access_token, partnerId),
    enabled: !!session?.access_token && !!partnerId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRecentAliases() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'recent-aliases'],
    queryFn: () => api.journal.recentAliases(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreatePartner() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePartnerRequest) =>
      api.journal.partners.create(session!.access_token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export function useUpdatePartner() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartnerRequest }) =>
      api.journal.partners.update(session!.access_token, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export function useDeletePartner() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deleteEntries }: { id: string; deleteEntries: boolean }) =>
      api.journal.partners.delete(session!.access_token, id, deleteEntries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export function usePromoteAlias() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PromoteAliasRequest) =>
      api.journal.partners.promote(session!.access_token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}
