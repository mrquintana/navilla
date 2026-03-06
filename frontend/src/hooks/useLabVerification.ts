import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from './useAuth';
import type { LabVerifyRequest, LabVerifyResponse, LabConfirmRequest } from '../types/lab';

export function useLabVerify() {
  const { session } = useAuth();
  return useMutation<LabVerifyResponse, Error, LabVerifyRequest>({
    mutationFn: (data) => api.labs.verify(session!.access_token, data),
  });
}

export function useLabConfirm() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, LabConfirmRequest>({
    mutationFn: (data) => api.labs.confirm(session!.access_token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-log'] });
      queryClient.invalidateQueries({ queryKey: ['healthLogSummary'] });
      queryClient.invalidateQueries({ queryKey: ['exposures'] });
    },
  });
}
