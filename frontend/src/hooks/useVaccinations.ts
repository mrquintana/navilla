import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
  api,
  type VaccineSeries,
  type VaccinationDose,
  type CreateVaccinationRequest,
  type UpdateVaccinationRequest,
} from '../lib/api';

export type {
  VaccineSeries,
  VaccinationDose,
  CreateVaccinationRequest,
  UpdateVaccinationRequest,
};

export function useVaccinations() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['vaccinations'],
    queryFn: () => api.vaccinations.list(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateVaccination() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVaccinationRequest) =>
      api.vaccinations.create(session!.access_token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useUpdateVaccination() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVaccinationRequest }) =>
      api.vaccinations.update(session!.access_token, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useDeleteVaccination() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.vaccinations.delete(session!.access_token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}
