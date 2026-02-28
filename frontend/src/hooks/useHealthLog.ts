import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
  api,
  type TestVisit,
  type CreateTestVisitRequest,
  type UpdateTestVisitRequest,
  type HealthLogSummary,
  type ConditionHistory,
  type Lab,
  type CreateLabRequest,
  type UpdateLabRequest,
} from '../lib/api';

export type {
  TestVisit,
  CreateTestVisitRequest,
  UpdateTestVisitRequest,
  HealthLogSummary,
  ConditionHistory,
  Lab,
  CreateLabRequest,
  UpdateLabRequest,
};

export function useHealthLogSummary() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['health-log', 'summary'],
    queryFn: () => api.healthLog.summary(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000,
  });
}

export function useHealthLogVisits() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['health-log', 'visits'],
    queryFn: () => api.healthLog.visits.list(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000,
  });
}

export function useHealthLogVisit(id: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['health-log', 'visit', id],
    queryFn: () => api.healthLog.visits.get(session!.access_token, id),
    enabled: !!session?.access_token && !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useConditionHistory(type: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['health-log', 'condition', type],
    queryFn: () => api.healthLog.condition(session!.access_token, type),
    enabled: !!session?.access_token && !!type,
    staleTime: 2 * 60 * 1000,
  });
}

export function useHealthLogLabs() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['health-log', 'labs'],
    queryFn: () => api.healthLog.labs.list(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTestVisit() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTestVisitRequest) =>
      api.healthLog.visits.create(session!.access_token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-log'] });
    },
  });
}

export function useUpdateTestVisit() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestVisitRequest }) =>
      api.healthLog.visits.update(session!.access_token, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-log'] });
    },
  });
}

export function useDeleteTestVisit() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.healthLog.visits.delete(session!.access_token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-log'] });
    },
  });
}

export function useCreateLab() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLabRequest) =>
      api.healthLog.labs.create(session!.access_token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-log', 'labs'] });
    },
  });
}

export function useUpdateLab() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLabRequest }) =>
      api.healthLog.labs.update(session!.access_token, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-log', 'labs'] });
    },
  });
}

export function useDeleteLab() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.healthLog.labs.delete(session!.access_token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-log', 'labs'] });
    },
  });
}
