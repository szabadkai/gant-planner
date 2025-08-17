import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { ID, Task, Staff, Project } from './types';

export function useStaff() {
  return useQuery<Staff[]>({ queryKey: ['staff'], queryFn: api.listStaff });
}

export function useBacklog() {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'backlog'],
    queryFn: api.listBacklog,
  });
}

export function useStaffTasks(staffId: ID) {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'staff', staffId],
    queryFn: () => api.listTasksFor(staffId),
  });
}

export function useAllTasks() {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'all'],
    queryFn: api.listAllTasks,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['themes'] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: ID;
      patch: Partial<
        Pick<
          Task,
          | 'name'
          | 'mandays'
          | 'jiraUrl'
          | 'theme'
          | 'dependencies'
          | 'dueDate'
          | 'priority'
        >
      >;
    }) => api.updateTask(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['themes'] });
    },
  });
}

export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.move,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['themes'] });
    },
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createStaff,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => api.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['themes'] });
    },
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => api.deleteStaff(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useAutoAssign() {
  const qc = useQueryClient();
  const [isAssigning, setIsAssigning] = useState(false);

  const autoAssign = async () => {
    try {
      setIsAssigning(true);

      // Get fresh data
      const staff = await qc.fetchQuery({
        queryKey: ['staff'],
        queryFn: api.listStaff,
      });
      const backlogTasks = await qc.fetchQuery({
        queryKey: ['tasks', 'backlog'],
        queryFn: api.listBacklog,
      });

      if (!staff || staff.length === 0) {
        alert('No staff members available for assignment');
        return;
      }

      if (!backlogTasks || backlogTasks.length === 0) {
        alert('No tasks in backlog to assign');
        return;
      }

      // Get current workload for each staff member
      const staffWorkloads = await Promise.all(
        staff.map(async (s) => {
          const tasks = await api.listTasksFor(s.id);
          const totalDays = tasks.reduce((sum, task) => sum + task.mandays, 0);
          return { staffId: s.id, name: s.name, workload: totalDays };
        })
      );

      // Assign each task to the staff member with the least workload
      for (const task of backlogTasks) {
        // Find staff member with minimum workload
        const targetStaff = staffWorkloads.reduce((min, curr) =>
          curr.workload < min.workload ? curr : min
        );

        // Move task to the end of this staff member's queue
        await api.move({
          taskId: task.id,
          targetStaffId: targetStaff.staffId,
          beforeTaskId: null,
          afterTaskId: null,
        });

        // Update workload for next iteration
        targetStaff.workload += task.mandays;
      }

      // Refresh all task queries
      qc.invalidateQueries({ queryKey: ['tasks'] });

      alert(
        `Assigned ${backlogTasks.length} tasks evenly across ${staff.length} staff members`
      );
    } catch (error) {
      console.error('Auto-assign failed:', error);
      alert('Auto-assign failed. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  return { autoAssign, isLoading: isAssigning };
}

export function useThemesSummary() {
  return useQuery({
    queryKey: ['themes', 'summary'],
    queryFn: api.themesSummary,
  });
}

// Project hooks
export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: api.listProjects,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { title?: string; isCurrent?: boolean };
    }) => api.updateProject(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['user'] });
      // Invalidate all project-scoped data when switching projects
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['themes'] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['user'] });
      // Invalidate all project-scoped data
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['themes'] });
    },
  });
}
