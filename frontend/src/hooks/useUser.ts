import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { api, type UserProfile } from '../lib/api';

export type { UserProfile };

export function useUser() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => api.users.me(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
