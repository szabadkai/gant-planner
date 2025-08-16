import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import multipart from "@fastify/multipart";
import { z, ZodError } from "zod";
import { PrismaClient, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

await app.register(sensible);
await app.register(cors, { origin: true });
await app.register(multipart);

// Map Zod validation errors to 400s instead of 500s
app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) {
        return reply
            .status(400)
            .send({ error: "validation_error", issues: err.issues });
    }
    return reply.send(err);
});

// Health
app.get("/api/health", async () => ({ status: "ok" }));

// --- Authentication ---
app.post("/api/auth/request-login", async (req, reply) => {
    const body = z
        .object({ email: z.string().email() })
        .parse((req as any).body);

    // Create verification token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.verificationToken.create({
        data: {
            email: body.email,
            token,
            expiresAt,
        },
    });

    // In a real app, you'd send this via email
    // For development, we'll log it to console
    const frontendUrl =
        process.env.FRONTEND_URL ||
        `http://localhost:${process.env.PORT || 4000}`;
    const magicLink = `${frontendUrl}/login?token=${token}`;
    console.log(`\n🔗 Magic login link for ${body.email}:`);
    console.log(`${magicLink}\n`);

    return {
        message:
            "Verification email sent! Check your email for the login link.",
    };
});

app.post("/api/auth/verify", async (req, reply) => {
    const body = z.object({ token: z.string() }).parse((req as any).body);

    // Find and validate token
    const verificationToken = await prisma.verificationToken.findUnique({
        where: { token: body.token },
    });

    if (!verificationToken || verificationToken.usedAt) {
        return reply.status(400).send({
            error: "invalid_token",
            message: "Invalid or expired token",
        });
    }

    if (verificationToken.expiresAt < new Date()) {
        return reply
            .status(400)
            .send({ error: "expired_token", message: "Token has expired" });
    }

    // Mark token as used
    await prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
    });

    // Find or create user
    let user = await prisma.user.findUnique({
        where: { email: verificationToken.email },
    });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: verificationToken.email,
                name: verificationToken.email.split("@")[0],
                projectTitle: null,
            },
        });
    }

    return { user: { id: user.id, email: user.email, name: user.name, projectTitle: user.projectTitle } };
});

app.get("/api/auth/me", async (req, reply) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
        return reply
            .status(401)
            .send({ error: "unauthorized", message: "No user ID provided" });
    }

    const user = await prisma.user.findUnique({ 
        where: { id: userId },
        include: { currentProject: true }
    });
    if (!user) {
        return reply
            .status(401)
            .send({ error: "unauthorized", message: "User not found" });
    }

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            projectTitle: user.projectTitle,
            currentProject: user.currentProject,
        },
    };
});

app.patch(
    "/api/auth/me",
    { preHandler: requireAuth },
    async (req: any, reply) => {
        const body = z
            .object({
                projectTitle: z
                    .string()
                    .trim()
                    .optional()
                    .or(z.literal(""))
                    .transform((v) => (v === "" ? null : v || null)),
            })
            .parse((req as any).body);

        const updated = await prisma.user.update({
            where: { id: req.userId },
            data: { projectTitle: body.projectTitle },
        });

        return {
            user: {
                id: updated.id,
                email: updated.email,
                name: updated.name,
                projectTitle: updated.projectTitle,
            },
        };
    }
);

// Auth middleware helper
function requireAuth(req: any, reply: any, done: any) {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
        return reply
            .status(401)
            .send({ error: "unauthorized", message: "No user ID provided" });
    }
    req.userId = userId;
    done();
}

// Helpers
async function getCurrentProject(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { currentProject: true }
    });
    return user?.currentProject || null;
}

async function maxPosition(staffId: string | null) {
    const where = { staffId: staffId ?? null } as const;
    const last = await prisma.assignment.findFirst({
        where,
        orderBy: { position: "desc" },
        select: { position: true },
    });
    if (!last) return 0;
    // Prisma Decimal -> number
    return Number(last.position);
}

function nextPosition(base: number) {
    // leave gaps to reduce reindexing
    return base + 1024;
}

// Project routes
app.get("/api/projects", { preHandler: requireAuth }, async (req: any) => {
    const projects = await prisma.project.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: "desc" },
    });
    return projects;
});

app.post("/api/projects", { preHandler: requireAuth }, async (req: any, reply) => {
    const body = z
        .object({ title: z.string().trim().min(1, "Title is required") })
        .parse(req.body);

    const project = await prisma.project.create({
        data: {
            title: body.title,
            userId: req.userId,
        },
    });

    // Set this as the user's current project
    await prisma.user.update({
        where: { id: req.userId },
        data: { currentProjectId: project.id },
    });

    return project;
});

app.patch("/api/projects/:id", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = z.object({ id: z.string() }).parse(req.params);
    const body = z
        .object({ 
            title: z.string().trim().min(1, "Title is required").optional(),
            isCurrent: z.boolean().optional()
        })
        .parse(req.body);

    // Verify project ownership
    const project = await prisma.project.findFirst({
        where: { id: params.id, userId: req.userId },
    });
    if (!project) {
        return reply.notFound("Project not found");
    }

    // Update project
    const updatedProject = await prisma.project.update({
        where: { id: params.id },
        data: { title: body.title },
    });

    // Set as current project if requested
    if (body.isCurrent) {
        await prisma.user.update({
            where: { id: req.userId },
            data: { currentProjectId: params.id },
        });
    }

    return updatedProject;
});

app.delete("/api/projects/:id", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = z.object({ id: z.string() }).parse(req.params);

    // Verify project ownership
    const project = await prisma.project.findFirst({
        where: { id: params.id, userId: req.userId },
    });
    if (!project) {
        return reply.notFound("Project not found");
    }

    // Check if this is the user's only project
    const projectCount = await prisma.project.count({
        where: { userId: req.userId },
    });
    if (projectCount === 1) {
        return reply.badRequest("Cannot delete your only project");
    }

    // Delete the project (cascades to tasks and staff)
    await prisma.project.delete({
        where: { id: params.id },
    });

    // If this was the current project, set current to null
    const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { currentProjectId: true },
    });
    if (user?.currentProjectId === params.id) {
        await prisma.user.update({
            where: { id: req.userId },
            data: { currentProjectId: null },
        });
    }

    return { success: true };
});

// Staff routes
app.get("/api/staff", { preHandler: requireAuth }, async (req: any) => {
    const currentProject = await getCurrentProject(req.userId);
    if (!currentProject) {
        return [];
    }
    
    const staff = await prisma.staff.findMany({
        where: { 
            userId: req.userId,
            projectId: currentProject.id 
        },
        orderBy: { name: "asc" },
    });
    return staff;
});

app.post("/api/staff", { preHandler: requireAuth }, async (req: any, reply) => {
    const currentProject = await getCurrentProject(req.userId);
    if (!currentProject) {
        return reply.badRequest("No current project selected");
    }
    
    const body = z
        .object({ name: z.string().trim().min(1) })
        .parse((req as any).body);
    const created = await prisma.staff.create({
        data: {
            name: body.name,
            userId: req.userId,
            projectId: currentProject.id,
        },
    });
    return created;
});

app.delete(
    "/api/staff/:id",
    { preHandler: requireAuth },
    async (req: any, reply) => {
        const { id } = req.params as any as { id: string };

        // Verify staff belongs to user and current project
        const currentProject = await getCurrentProject(req.userId);
        const staff = await prisma.staff.findUnique({ where: { id } });
        if (!staff || staff.userId !== req.userId || staff.projectId !== currentProject?.id) {
            return reply
                .status(404)
                .send({ error: "not_found", message: "Staff not found" });
        }

        // Move their tasks to backlog preserving order
        const assigns = await prisma.assignment.findMany({
            where: { staffId: id },
            orderBy: { position: "asc" },
            select: { taskId: true },
        });
        let pos = await maxPosition(null);
        for (const a of assigns) {
            pos = nextPosition(pos);
            await prisma.assignment.update({
                where: { taskId: a.taskId },
                data: { staffId: null, position: new Prisma.Decimal(pos) },
            });
        }
        await prisma.staff.delete({ where: { id } });
        return { ok: true };
    }
);

// Tasks routes
app.get("/api/tasks", { preHandler: requireAuth }, async (req: any) => {
    const currentProject = await getCurrentProject(req.userId);
    if (!currentProject) {
        return [];
    }
    
    const q = (req.query as any) || {};
    const staffId = typeof q.staff_id === "string" ? q.staff_id : undefined;
    const unassigned = q.unassigned === "true" || q.unassigned === true;

    const whereAssign = staffId
        ? { staffId }
        : unassigned
          ? { staffId: null }
          : undefined;
    const include = { assignment: true } as const;
    let tasks;
    if (whereAssign) {
        const assigns = await prisma.assignment.findMany({
            where: whereAssign,
            orderBy: { position: "asc" },
            select: { taskId: true, position: true, staffId: true },
        });
        const ids = assigns.map((a) => a.taskId);
        const list = await prisma.task.findMany({
            where: {
                id: { in: ids },
                userId: req.userId,
                projectId: currentProject.id,
            },
            include,
        });
        const map = new Map(list.map((t) => [t.id, t] as const));
        tasks = assigns.map((a) => map.get(a.taskId)!).filter(Boolean);
    } else {
        tasks = await prisma.task.findMany({
            where: { 
                userId: req.userId,
                projectId: currentProject.id 
            },
            include,
        });
    }
    return tasks;
});

app.post("/api/tasks", { preHandler: requireAuth }, async (req: any, reply) => {
    const parse = z
        .object({
            name: z.string().trim().min(1),
            mandays: z.number().int().min(1),
            jiraUrl: z
                .string()
                .trim()
                .optional()
                .or(z.literal(""))
                .transform((v) => (v ? v : undefined)),
            theme: z
                .string()
                .trim()
                .optional()
                .or(z.literal(""))
                .transform((v) => (v ? v : undefined)),
            dependencies: z
                .array(z.string())
                .optional()
                .transform((v) => v ? JSON.stringify(v) : undefined),
            dueDate: z
                .string()
                .transform((v) => v ? new Date(v) : undefined)
                .optional(),
            priority: z
                .enum(["HIGH", "MEDIUM", "LOW"])
                .default("MEDIUM"),
        })
        .safeParse((req as any).body);
    if (!parse.success)
        return reply
            .status(400)
            .send({ error: "validation_error", issues: parse.error.issues });
    const body = parse.data;

    const currentProject = await getCurrentProject(req.userId);
    if (!currentProject) {
        return reply.badRequest("No current project selected");
    }
    
    const created = await prisma.$transaction(async (tx) => {
        const t = await tx.task.create({
            data: {
                name: body.name,
                mandays: body.mandays,
                jiraUrl: body.jiraUrl,
                theme: body.theme,
                dependencies: body.dependencies,
                dueDate: body.dueDate,
                priority: body.priority,
                userId: req.userId,
                projectId: currentProject.id,
            },
        });
        const pos = nextPosition(await maxPosition(null));
        await tx.assignment.create({
            data: {
                taskId: t.id,
                staffId: null,
                position: new Prisma.Decimal(pos),
            },
        });
        return t;
    });
    return created;
});

app.patch(
    "/api/tasks/:id",
    { preHandler: requireAuth },
    async (req: any, reply) => {
        const { id } = req.params as any as { id: string };
        const parse = z
            .object({
                name: z.string().trim().min(1).optional(),
                mandays: z.number().int().min(1).optional(),
                jiraUrl: z
                    .string()
                    .trim()
                    .optional()
                    .or(z.literal(""))
                    .transform((v) => (v === "" ? undefined : v)),
                theme: z
                    .string()
                    .trim()
                    .optional()
                    .or(z.literal(""))
                    .transform((v) => (v === "" ? undefined : v)),
                dependencies: z
                    .array(z.string())
                    .optional()
                    .transform((v) => v ? JSON.stringify(v) : undefined),
                dueDate: z
                    .string()
                    .transform((v) => v ? new Date(v) : undefined)
                    .optional(),
                priority: z
                    .enum(["HIGH", "MEDIUM", "LOW"])
                    .optional(),
            })
            .safeParse((req as any).body);
        if (!parse.success)
            return reply.status(400).send({
                error: "validation_error",
                issues: parse.error.issues,
            });
        const body = parse.data;

        // Verify task belongs to user and current project
        const currentProject = await getCurrentProject(req.userId);
        const task = await prisma.task.findUnique({ where: { id } });
        if (!task || task.userId !== req.userId || task.projectId !== currentProject?.id) {
            return reply
                .status(404)
                .send({ error: "not_found", message: "Task not found" });
        }

        const updated = await prisma.task.update({ where: { id }, data: body });
        return updated;
    }
);

app.delete(
    "/api/tasks/:id",
    { preHandler: requireAuth },
    async (req: any, reply) => {
        const { id } = req.params as any as { id: string };

        // Verify task belongs to user and current project
        const currentProject = await getCurrentProject(req.userId);
        const task = await prisma.task.findUnique({ where: { id } });
        if (!task || task.userId !== req.userId || task.projectId !== currentProject?.id) {
            return reply
                .status(404)
                .send({ error: "not_found", message: "Task not found" });
        }

        await prisma.task.delete({ where: { id } });
        return { ok: true };
    }
);

// Move / Reorder
app.post(
    "/api/assignments/move",
    { preHandler: requireAuth },
    async (req: any, reply) => {
        const body = z
            .object({
                taskId: z.string().min(1),
                targetStaffId: z.string().min(1).nullable(),
                beforeTaskId: z.string().min(1).nullable().optional(),
                afterTaskId: z.string().min(1).nullable().optional(),
            })
            .parse((req as any).body);

        // Verify task belongs to user and current project
        const currentProject = await getCurrentProject(req.userId);
        const task = await prisma.task.findUnique({
            where: { id: body.taskId },
        });
        if (!task || task.userId !== req.userId || task.projectId !== currentProject?.id) {
            return reply
                .status(404)
                .send({ error: "not_found", message: "Task not found" });
        }

        // Verify target staff belongs to user and current project (if specified)
        if (body.targetStaffId) {
            const staff = await prisma.staff.findUnique({
                where: { id: body.targetStaffId },
            });
            if (!staff || staff.userId !== req.userId || staff.projectId !== currentProject?.id) {
                return reply
                    .status(404)
                    .send({ error: "not_found", message: "Staff not found" });
            }
        }

        const targetStaffId = body.targetStaffId ?? null;
        let pos: number | null = null;
        const before = body.beforeTaskId
            ? await prisma.assignment.findUnique({
                  where: { taskId: body.beforeTaskId },
                  select: { position: true },
              })
            : null;
        const after = body.afterTaskId
            ? await prisma.assignment.findUnique({
                  where: { taskId: body.afterTaskId },
                  select: { position: true },
              })
            : null;
        if (before && after) {
            pos = (Number(before.position) + Number(after.position)) / 2;
        } else if (before) {
            pos = Number(before.position) + 1;
        } else if (after) {
            pos = Number(after.position) - 1;
        } else {
            pos = nextPosition(await maxPosition(targetStaffId));
        }

        const updated = await prisma.assignment.update({
            where: { taskId: body.taskId },
            data: { staffId: targetStaffId, position: new Prisma.Decimal(pos) },
        });
        return { ok: true, assignment: updated };
    }
);

// Themes summary
app.get(
    "/api/themes/summary",
    { preHandler: requireAuth },
    async (req: any) => {
        const currentProject = await getCurrentProject(req.userId);
        if (!currentProject) {
            return [];
        }
        
        const rows = await prisma.task.groupBy({
            by: ["theme"],
            _sum: { mandays: true },
            _count: true,
            where: { 
                userId: req.userId,
                projectId: currentProject.id 
            },
        });
        return rows
            .filter((r) => (r.theme ?? "").trim() !== "")
            .map((r) => ({
                theme: r.theme!,
                totalMandays: r._sum.mandays ?? 0,
                count: r._count,
            }))
            .sort((a, b) => b.totalMandays - a.totalMandays);
    }
);

// Danger: clear all user data (dev convenience)
app.post("/api/admin/clear", { preHandler: requireAuth }, async (req: any) => {
    const currentProject = await getCurrentProject(req.userId);
    if (!currentProject) {
        return { ok: true };
    }
    
    await prisma.$transaction([
        prisma.assignment.deleteMany({
            where: {
                task: { 
                    userId: req.userId,
                    projectId: currentProject.id 
                },
            },
        }),
        prisma.task.deleteMany({ 
            where: { 
                userId: req.userId,
                projectId: currentProject.id 
            } 
        }),
        prisma.staff.deleteMany({ 
            where: { 
                userId: req.userId,
                projectId: currentProject.id 
            } 
        }),
    ]);
    return { ok: true };
});

// CSV export (name,mandays,staff,theme,jira)
app.get("/api/export/csv", async (req: any, reply) => {
    // Support auth via header or query param for downloads
    const userId = req.headers["x-user-id"] || req.query["X-User-ID"];
    if (!userId) {
        return reply
            .status(401)
            .send({ error: "unauthorized", message: "No user ID provided" });
    }
    req.userId = userId;
    function csvEscape(val: unknown): string {
        const s = (val ?? "").toString();
        return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }

    const currentProject = await getCurrentProject(req.userId);
    if (!currentProject) {
        return reply
            .status(400)
            .send({ error: "no_project", message: "No current project selected" });
    }
    
    const header = ["name", "mandays", "staff", "theme", "jira", "dependencies", "dueDate", "priority"];
    const lines: string[] = [header.join(",")];

    // Backlog first - only user's current project tasks
    const backlogAssigns = await prisma.assignment.findMany({
        where: {
            staffId: null,
            task: { 
                userId: req.userId,
                projectId: currentProject.id 
            },
        },
        orderBy: { position: "asc" },
    });
    if (backlogAssigns.length) {
        const tasks = await prisma.task.findMany({
            where: {
                id: { in: backlogAssigns.map((a) => a.taskId) },
                userId: req.userId,
                projectId: currentProject.id,
            },
        });
        const map = new Map(tasks.map((t) => [t.id, t] as const));
        for (const a of backlogAssigns) {
            const t = map.get(a.taskId);
            if (!t) continue;
            lines.push(
                [
                    csvEscape(t.name),
                    t.mandays,
                    "",
                    csvEscape(t.theme ?? ""),
                    csvEscape(t.jiraUrl ?? ""),
                    csvEscape(t.dependencies ?? ""),
                    csvEscape(t.dueDate?.toISOString().split('T')[0] ?? ""),
                    csvEscape(t.priority ?? ""),
                ].join(",")
            );
        }
    }

    // Then staff queues in name order - only user's current project staff
    const staff = await prisma.staff.findMany({
        where: { 
            userId: req.userId,
            projectId: currentProject.id 
        },
        orderBy: { name: "asc" },
    });
    for (const s of staff) {
        const assigns = await prisma.assignment.findMany({
            where: {
                staffId: s.id,
                task: { 
                    userId: req.userId,
                    projectId: currentProject.id 
                },
            },
            orderBy: { position: "asc" },
        });
        if (!assigns.length) continue;
        const tasks = await prisma.task.findMany({
            where: {
                id: { in: assigns.map((a) => a.taskId) },
                userId: req.userId,
                projectId: currentProject.id,
            },
        });
        const map = new Map(tasks.map((t) => [t.id, t] as const));
        for (const a of assigns) {
            const t = map.get(a.taskId);
            if (!t) continue;
            lines.push(
                [
                    csvEscape(t.name),
                    t.mandays,
                    csvEscape(s.name),
                    csvEscape(t.theme ?? ""),
                    csvEscape(t.jiraUrl ?? ""),
                    csvEscape(t.dependencies ?? ""),
                    csvEscape(t.dueDate?.toISOString().split('T')[0] ?? ""),
                    csvEscape(t.priority ?? ""),
                ].join(",")
            );
        }
    }

    const csv = lines.join("\r\n");
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header(
        "Content-Disposition",
        `attachment; filename="gantt-export-${ts}.csv"`
    );
    return reply.send(csv);
});

// --- Sharing ---
app.post("/api/share", { preHandler: requireAuth }, async (req: any, reply) => {
    const currentProject = await getCurrentProject(req.userId);
    if (!currentProject) {
        return reply.badRequest("No current project selected");
    }
    
    const token = randomUUID();
    const link = await prisma.shareLink.create({
        data: {
            token,
            type: "live",
            permission: "view",
            viewParams: null,
            createdBy: req.userId,
            projectId: currentProject.id,
        },
    });
    return { token };
});

async function ensureShare(token: string) {
    const share = await prisma.shareLink.findUnique({
        where: { token },
        include: { user: true },
    });
    if (!share || share.revokedAt)
        throw app.httpErrors.notFound("Share not found");
    if (share.expiresAt && share.expiresAt < new Date())
        throw app.httpErrors.gone("Share expired");
    return share;
}

app.get("/api/share/:token/staff", async (req) => {
    const { token } = req.params as any;
    const share = await ensureShare(token);
    const staff = await prisma.staff.findMany({
        where: { 
            userId: share.createdBy,
            projectId: share.projectId 
        },
        orderBy: { name: "asc" },
    });
    return staff;
});

app.get("/api/share/:token/project", async (req) => {
    const { token } = req.params as any;
    const share = await ensureShare(token);
    const project = share.projectId ? await prisma.project.findUnique({
        where: { id: share.projectId },
        select: { title: true },
    }) : null;
    return { projectTitle: project?.title || null };
});

app.get("/api/share/:token/tasks", async (req) => {
    const { token } = req.params as any;
    const share = await ensureShare(token);
    const q = (req.query as any) || {};
    const staffId = typeof q.staff_id === "string" ? q.staff_id : undefined;
    const unassigned = q.unassigned === "true" || q.unassigned === true;
    const whereAssign = staffId
        ? { staffId }
        : unassigned
          ? { staffId: null }
          : undefined;
    const include = { assignment: true } as const;
    let tasks;
    if (whereAssign) {
        const assigns = await prisma.assignment.findMany({
            where: {
                ...whereAssign,
                task: { 
                    userId: share.createdBy,
                    projectId: share.projectId 
                },
            },
            orderBy: { position: "asc" },
            select: { taskId: true },
        });
        const ids = assigns.map((a) => a.taskId);
        const list = await prisma.task.findMany({
            where: {
                id: { in: ids },
                userId: share.createdBy,
                projectId: share.projectId,
            },
            include,
        });
        const map = new Map(list.map((t) => [t.id, t] as const));
        tasks = assigns.map((a) => map.get(a.taskId)!).filter(Boolean);
    } else {
        tasks = await prisma.task.findMany({
            where: { 
                userId: share.createdBy,
                projectId: share.projectId 
            },
            include,
        });
    }
    return tasks;
});

app.get("/api/share/:token/themes/summary", async (req) => {
    const { token } = req.params as any;
    const share = await ensureShare(token);
    const rows = await prisma.task.groupBy({
        by: ["theme"],
        _sum: { mandays: true },
        _count: true,
        where: { 
            userId: share.createdBy,
            projectId: share.projectId 
        },
    });
    return rows
        .filter((r) => (r.theme ?? "").trim() !== "")
        .map((r) => ({
            theme: r.theme!,
            totalMandays: r._sum.mandays ?? 0,
            count: r._count,
        }))
        .sort((a, b) => b.totalMandays - a.totalMandays);
});

const port = Number(process.env.PORT || 4000);
app.listen({ port, host: "0.0.0.0" })
    .then(() => app.log.info(`API listening on http://localhost:${port}`))
    .catch((err) => {
        app.log.error(err);
        process.exit(1);
    });
