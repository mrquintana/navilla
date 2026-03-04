import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { api } from '../lib/api';
import type { ReciprocityStatus } from '../types/reciprocity';

export type { ReciprocityStatus };

export function useReciprocityStatus() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['reciprocity', 'status'],
    queryFn: () => api.reciprocity.status(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000,
  });
}

export function useOptIn() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.reciprocity.optIn(session!.access_token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reciprocity'] });
      queryClient.invalidateQueries({ queryKey: ['exposures'] });
    },
  });
}

export function useOptOut() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.reciprocity.optOut(session!.access_token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reciprocity'] });
      queryClient.invalidateQueries({ queryKey: ['exposures'] });
    },
  });
}
