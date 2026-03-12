import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { api, type NetworkHealth } from '../lib/api';

export type { NetworkHealth };

export function useNetworkHealth() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['networkHealth'],
    queryFn: () => api.networkHealth.get(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000,
  });
}
