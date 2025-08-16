import { Task, Staff, ID, User, Project } from "./types";

async function j<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<T>;
}

// Auth headers helper
function getAuthHeaders(): HeadersInit {
    const userId = localStorage.getItem('userId');
    return userId ? { 'X-User-ID': userId } : {};
}

export const api = {
    // Auth endpoints
    requestLogin: (email: string): Promise<{ message: string }> =>
        fetch("/api/auth/request-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        }).then((res) => j<{ message: string }>(res)),
    verifyToken: (token: string): Promise<{ user: User }> =>
        fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        }).then((res) => j<{ user: User }>(res)),
    me: (): Promise<{ user: User }> =>
        fetch("/api/auth/me", {
            headers: getAuthHeaders(),
        }).then((res) => j<{ user: User }>(res)),
    updateProjectTitle: (projectTitle: string | null): Promise<{ user: User }> =>
        fetch("/api/auth/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({ projectTitle }),
        }).then((res) => j<{ user: User }>(res)),
    
    // Project endpoints
    listProjects: (): Promise<Project[]> =>
        fetch("/api/projects", { headers: getAuthHeaders() }).then((res) => j<Project[]>(res)),
    createProject: (title: string): Promise<Project> =>
        fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({ title }),
        }).then((res) => j<Project>(res)),
    updateProject: (id: string, data: { title?: string; isCurrent?: boolean }): Promise<Project> =>
        fetch(`/api/projects/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(data),
        }).then((res) => j<Project>(res)),
    deleteProject: (id: string): Promise<{ success: true }> =>
        fetch(`/api/projects/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        }).then((res) => j<{ success: true }>(res)),
    
    health: () => fetch("/api/health").then((r) => r.json()),
    listStaff: (): Promise<Staff[]> => 
        fetch("/api/staff", { headers: getAuthHeaders() }).then((res) => j<Staff[]>(res)),
    createStaff: (name: string): Promise<Staff> =>
        fetch("/api/staff", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({ name }),
        }).then((res) => j<Staff>(res)),
    deleteStaff: (id: ID): Promise<{ ok: true }> =>
        fetch(`/api/staff/${id}`, { 
            method: "DELETE",
            headers: getAuthHeaders()
        }).then((res) => j<{ ok: true }>(res)),
    listBacklog: (): Promise<Task[]> =>
        fetch("/api/tasks?unassigned=true", { headers: getAuthHeaders() }).then((res) => j<Task[]>(res)),
    listTasksFor: (staffId: ID): Promise<Task[]> =>
        fetch(`/api/tasks?staff_id=${encodeURIComponent(staffId)}`, { headers: getAuthHeaders() }).then((res) => j<Task[]>(res)),
    createTask: (input: {
        name: string;
        mandays: number;
        jiraUrl?: string;
        theme?: string;
    }): Promise<Task> =>
        fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(input),
        }).then((res) => j<Task>(res)),
    updateTask: (
        id: ID,
        patch: Partial<Pick<Task, "name" | "mandays" | "jiraUrl" | "theme">>
    ): Promise<Task> =>
        fetch(`/api/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(patch),
        }).then((res) => j<Task>(res)),
    deleteTask: (id: ID): Promise<{ ok: true }> =>
        fetch(`/api/tasks/${id}`, { 
            method: "DELETE",
            headers: getAuthHeaders()
        }).then((res) => j<{ ok: true }>(res)),
    move: (input: {
        taskId: ID;
        targetStaffId: ID | null;
        beforeTaskId?: ID | null;
        afterTaskId?: ID | null;
    }): Promise<any> =>
        fetch("/api/assignments/move", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(input),
        }).then((res) => j<any>(res)),
    themesSummary: (): Promise<
        { theme: string; totalMandays: number; count: number }[]
    > => fetch("/api/themes/summary", { headers: getAuthHeaders() }).then((res) => j<{ theme: string; totalMandays: number; count: number }[]>(res)),
    clearAll: (): Promise<{ ok: true }> => 
        fetch('/api/admin/clear', { 
            method: 'POST',
            headers: getAuthHeaders()
        }).then((res) => j<{ ok: true }>(res)),
    exportCsv: (): void => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            throw new Error('User not authenticated');
        }
        
        // Download via query param for auth
        const url = `/api/export/csv?X-User-ID=${encodeURIComponent(userId)}`;
        window.open(url, '_blank');
    },
    createShare: (): Promise<{ token: string }> =>
        fetch('/api/share', {
            method: 'POST',
            headers: getAuthHeaders()
        }).then(j<{ token: string }>),
    
    // Shared (public) endpoints - no auth required
    getSharedStaff: (token: string): Promise<Staff[]> =>
        fetch(`/api/share/${token}/staff`).then(j<Staff[]>),
    
    getSharedTasks: (token: string, params?: { staff_id?: string; unassigned?: boolean }): Promise<Task[]> => {
        const query = new URLSearchParams();
        if (params?.staff_id) query.set('staff_id', params.staff_id);
        if (params?.unassigned) query.set('unassigned', 'true');
        const queryString = query.toString();
        const url = `/api/share/${token}/tasks${queryString ? `?${queryString}` : ''}`;
        return fetch(url).then(j<Task[]>);
    },
    
    getSharedThemesSummary: (token: string): Promise<{ theme: string; totalMandays: number; count: number }[]> =>
        fetch(`/api/share/${token}/themes/summary`).then(j<{ theme: string; totalMandays: number; count: number }[]>),
    
    getSharedProject: (token: string): Promise<{ projectTitle: string | null }> =>
        fetch(`/api/share/${token}/project`).then(j<{ projectTitle: string | null }>),
};
