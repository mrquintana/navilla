import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
}

async function fetchUser(accessToken: string): Promise<UserProfile> {
  const response = await fetch('/api/users/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return response.json();
}

export function useUser() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => fetchUser(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
