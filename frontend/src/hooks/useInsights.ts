import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { api, type InsightsResponse } from '../lib/api';

export type { InsightsResponse };

export function useInsights() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['insights'],
    queryFn: () => api.insights.get(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000,
  });
}
