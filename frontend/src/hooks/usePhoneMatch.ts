import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { api } from '../lib/api';
import type { PhoneMatchNotification } from '../types/phoneMatch';

export type { PhoneMatchNotification };

export function usePendingPhoneMatches() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['phone-match', 'pending'],
    queryFn: () => api.phoneMatch.pending(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000,
  });
}

export function useConfirmPhoneMatch() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      api.phoneMatch.confirm(session!.access_token, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-match'] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

export function useDenyPhoneMatch() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      api.phoneMatch.deny(session!.access_token, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-match'] });
    },
  });
}

export function useBlockPhoneNumber() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (phoneHash: string) =>
      api.phoneMatch.block(session!.access_token, { phoneHash }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-match'] });
    },
  });
}
