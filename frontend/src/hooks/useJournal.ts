import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
  api,
  type JournalEntry,
  type CreateJournalEntryRequest,
  type UpdateJournalEntryRequest,
  type JournalSummary,
  type JournalTemplates,
} from '../lib/api';

export type { JournalEntry, CreateJournalEntryRequest, UpdateJournalEntryRequest, JournalSummary, JournalTemplates };

export function useJournalEntries(month?: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'list', month ?? 'all'],
    queryFn: () => api.journal.list(session!.access_token, month),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000,
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
