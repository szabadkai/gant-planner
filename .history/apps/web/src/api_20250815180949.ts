import { Task, Staff, ID } from "./types";

async function j<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export const api = {
    health: () => fetch("/api/health").then((r) => r.json()),
    listStaff: (): Promise<Staff[]> => fetch("/api/staff").then(j),
    createStaff: (name: string): Promise<Staff> =>
        fetch("/api/staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        }).then(j),
    deleteStaff: (id: ID): Promise<{ ok: true }> =>
        fetch(`/api/staff/${id}`, { method: "DELETE" }).then(j),
    listBacklog: (): Promise<Task[]> =>
        fetch("/api/tasks?unassigned=true").then(j),
    listTasksFor: (staffId: ID): Promise<Task[]> =>
        fetch(`/api/tasks?staff_id=${encodeURIComponent(staffId)}`).then(j),
    createTask: (input: {
        name: string;
        mandays: number;
        jiraUrl?: string;
        theme?: string;
    }): Promise<Task> =>
        fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        }).then(j),
    updateTask: (
        id: ID,
        patch: Partial<Pick<Task, "name" | "mandays" | "jiraUrl" | "theme">>
    ): Promise<Task> =>
        fetch(`/api/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
        }).then(j),
    deleteTask: (id: ID): Promise<{ ok: true }> =>
        fetch(`/api/tasks/${id}`, { method: "DELETE" }).then(j),
    move: (input: {
        taskId: ID;
        targetStaffId: ID | null;
        beforeTaskId?: ID | null;
        afterTaskId?: ID | null;
    }): Promise<any> =>
        fetch("/api/assignments/move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        }).then(j),
    themesSummary: (): Promise<
        { theme: string; totalMandays: number; count: number }[]
    > => fetch("/api/themes/summary").then(j),
};
