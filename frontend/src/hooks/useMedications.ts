import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
  api,
  type Medication,
  type CreateMedicationRequest,
  type UpdateMedicationRequest,
  type LogDoseRequest,
  type DoseLogEntry,
  type MedicationAdherence,
} from '../lib/api';

export type {
  Medication,
  CreateMedicationRequest,
  UpdateMedicationRequest,
  LogDoseRequest,
  DoseLogEntry,
  MedicationAdherence,
};

export function useMedications() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['medications'],
    queryFn: () => api.medications.list(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMedication(id: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['medications', id],
    queryFn: () => api.medications.get(session!.access_token, id),
    enabled: !!session?.access_token && !!id,
  });
}

export function useCreateMedication() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMedicationRequest) =>
      api.medications.create(session!.access_token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useUpdateMedication() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMedicationRequest }) =>
      api.medications.update(session!.access_token, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useDeleteMedication() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.medications.delete(session!.access_token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useLogDose() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LogDoseRequest }) =>
      api.medications.logDose(session!.access_token, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useAdherence(id: string, month: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['medications', id, 'adherence', month],
    queryFn: () => api.medications.adherence(session!.access_token, id, month),
    enabled: !!session?.access_token && !!id && !!month,
  });
}
