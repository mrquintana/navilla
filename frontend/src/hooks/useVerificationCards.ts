import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type CreateVerificationCardRequest, type UpdateVerificationCardRequest, type VerificationCardResponse } from '../lib/api';
import { useAuth } from './useAuth';

export function useVerificationCards() {
  const { session } = useAuth();
  return useQuery<VerificationCardResponse[]>({
    queryKey: ['verificationCards'],
    queryFn: () => api.verificationCards.list(session!.access_token),
    enabled: !!session?.access_token,
  });
}

export function useCreateVerificationCard() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<VerificationCardResponse, Error, CreateVerificationCardRequest>({
    mutationFn: (data) => api.verificationCards.create(session!.access_token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verificationCards'] });
    },
  });
}

export function useUpdateVerificationCard() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<VerificationCardResponse, Error, { id: string; data: UpdateVerificationCardRequest }>({
    mutationFn: ({ id, data }) => api.verificationCards.update(session!.access_token, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verificationCards'] });
    },
  });
}

export function useDeleteVerificationCard() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.verificationCards.delete(session!.access_token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verificationCards'] });
    },
  });
}
