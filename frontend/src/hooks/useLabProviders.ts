import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from './useAuth';
import type { LabProviderConfig } from '../types/lab';

export function useLabProviders() {
  const { session } = useAuth();
  return useQuery<LabProviderConfig[]>({
    queryKey: ['lab-providers'],
    queryFn: () => api.labs.providers(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 1000 * 60 * 60,
  });
}
