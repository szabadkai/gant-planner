import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export function useSharedStaff(token: string) {
  return useQuery({
    queryKey: ['shared', 'staff', token],
    queryFn: () => api.getSharedStaff(token),
    enabled: !!token,
  });
}

export function useSharedBacklog(token: string) {
  return useQuery({
    queryKey: ['shared', 'tasks', 'backlog', token],
    queryFn: () => api.getSharedTasks(token, { unassigned: true }),
    enabled: !!token,
  });
}

export function useSharedStaffTasks(token: string, staffId: string) {
  return useQuery({
    queryKey: ['shared', 'tasks', 'staff', token, staffId],
    queryFn: () => api.getSharedTasks(token, { staff_id: staffId }),
    enabled: !!token && !!staffId,
  });
}

export function useSharedThemes(token: string) {
  return useQuery({
    queryKey: ['shared', 'themes', token],
    queryFn: () => api.getSharedThemesSummary(token),
    enabled: !!token,
  });
}

export function useSharedProject(token: string) {
  return useQuery({
    queryKey: ['shared', 'project', token],
    queryFn: () => api.getSharedProject(token),
    enabled: !!token,
  });
}