import { Task, Staff, ID } from "./types";

async function j<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(await res.text());
    return res.json();
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
        }).then(j),
    verifyToken: (token: string): Promise<{ user: { id: string; email: string; name: string | null } }> =>
        fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        }).then(j),
    me: (): Promise<{ user: { id: string; email: string; name: string | null } }> =>
        fetch("/api/auth/me", {
            headers: getAuthHeaders(),
        }).then(j),
    
    health: () => fetch("/api/health").then((r) => r.json()),
    listStaff: (): Promise<Staff[]> => 
        fetch("/api/staff", { headers: getAuthHeaders() }).then(j),
    createStaff: (name: string): Promise<Staff> =>
        fetch("/api/staff", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({ name }),
        }).then(j),
    deleteStaff: (id: ID): Promise<{ ok: true }> =>
        fetch(`/api/staff/${id}`, { 
            method: "DELETE",
            headers: getAuthHeaders()
        }).then(j),
    listBacklog: (): Promise<Task[]> =>
        fetch("/api/tasks?unassigned=true", { headers: getAuthHeaders() }).then(j),
    listTasksFor: (staffId: ID): Promise<Task[]> =>
        fetch(`/api/tasks?staff_id=${encodeURIComponent(staffId)}`, { headers: getAuthHeaders() }).then(j),
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
        }).then(j),
    updateTask: (
        id: ID,
        patch: Partial<Pick<Task, "name" | "mandays" | "jiraUrl" | "theme">>
    ): Promise<Task> =>
        fetch(`/api/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(patch),
        }).then(j),
    deleteTask: (id: ID): Promise<{ ok: true }> =>
        fetch(`/api/tasks/${id}`, { 
            method: "DELETE",
            headers: getAuthHeaders()
        }).then(j),
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
        }).then(j),
    themesSummary: (): Promise<
        { theme: string; totalMandays: number; count: number }[]
    > => fetch("/api/themes/summary", { headers: getAuthHeaders() }).then(j),
    clearAll: (): Promise<{ ok: true }> => 
        fetch('/api/admin/clear', { 
            method: 'POST',
            headers: getAuthHeaders()
        }).then(j),
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
};
