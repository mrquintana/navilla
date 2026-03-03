import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
  api,
  type Reminder,
  type ReminderSettings,
  type UpdateReminderSettingsRequest,
} from '../lib/api';

export type { Reminder, ReminderSettings, UpdateReminderSettingsRequest };

export function useReminders() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['reminders'],
    queryFn: () => api.reminders.list(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 60 * 1000,
  });
}

export function useUpcomingReminders(days: number) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['reminders', 'upcoming', days],
    queryFn: () => api.reminders.upcoming(session!.access_token, days),
    enabled: !!session?.access_token,
    staleTime: 60 * 1000,
  });
}

export function useSnoozeReminder() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, until }: { id: string; until: string }) =>
      api.reminders.snooze(session!.access_token, id, until),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useCompleteReminder() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.reminders.complete(session!.access_token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useToggleReminder() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.reminders.toggle(session!.access_token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useDeleteReminder() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.reminders.delete(session!.access_token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useReminderSettings() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['reminders', 'settings'],
    queryFn: () => api.reminders.settings.get(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateReminderSettings() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateReminderSettingsRequest) =>
      api.reminders.settings.update(session!.access_token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', 'settings'] });
    },
  });
}
