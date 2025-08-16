import { VercelRequest, VercelResponse } from '@vercel/node';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import { z, ZodError } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

// Create Fastify instance
const app = Fastify({ logger: false });
const prisma = new PrismaClient();

await app.register(sensible);
await app.register(cors, { origin: true });
await app.register(multipart);

// Map Zod validation errors to 400s instead of 500s
app.setErrorHandler((err, req, reply) => {
  if (err instanceof ZodError) {
    return reply.status(400).send({ error: 'validation_error', issues: err.issues });
  }
  return reply.send(err);
});

app.post('/api/auth/request-login', async (req, reply) => {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { email } = z.object({ email: z.string().email() }).parse(body);
  const token = randomUUID();
  const referer = req.headers.referer || 'http://localhost:3000';
  const magicLink = new URL('/', referer);
  magicLink.searchParams.set('token', token);

  // In a real app, you'd send a magic link to the user's email
  console.log(`Login requested for ${email}. Magic link: ${magicLink.href}`);
  return { ok: true };
});

app.post('/api/auth/verify', async (req, reply) => {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { token } = z.object({ token: z.string() }).parse(body);
  // In a real app, you'd verify the token and log the user in
  console.log(`Token verification requested for ${token}`);
  return { user: { id: '1', email: 'test@example.com', name: 'Test User', projectTitle: 'Test Project' } };
});

app.get('/api/auth/me', async (req, reply) => {
  const userId = req.headers['x-user-id'];
  // In a real app, you'd get the user from the database
  console.log(`User requested for id ${userId}`);
  return { user: { id: '1', email: 'test@example.com', name: 'Test User', projectTitle: 'Test Project' } };
});


// Health
app.get('/api/health', async () => ({ status: 'ok' }));


// Helpers
async function maxPosition(staffId: string | null) {
  const where = { staffId: staffId ?? null } as const;
  const last = await prisma.assignment.findFirst({
    where,
    orderBy: { position: 'desc' },
    select: { position: true }
  });
  if (!last) return 0;
  return Number(last.position);
}

function nextPosition(base: number) {
  return base + 1024;
}

// Staff routes
app.get('/api/staff', async () => {
  const staff = await prisma.staff.findMany({ orderBy: { name: 'asc' } });
  return staff;
});

app.post('/api/staff', async (req, reply) => {
  const body = z.object({ name: z.string().trim().min(1) }).parse((req as any).body);
  const created = await prisma.staff.create({ data: { name: body.name } });
  return created;
});

app.delete('/api/staff/:id', async (req, reply) => {
  const { id } = (req.params as any) as { id: string };
  const assigns = await prisma.assignment.findMany({
    where: { staffId: id },
    orderBy: { position: 'asc' },
    select: { taskId: true }
  });
  let pos = await maxPosition(null);
  for (const a of assigns) {
    pos = nextPosition(pos);
    await prisma.assignment.update({ where: { taskId: a.taskId }, data: { staffId: null, position: new Prisma.Decimal(pos) } });
  }
  await prisma.staff.delete({ where: { id } });
  return { ok: true };
});

// Tasks routes
app.get('/api/tasks', async (req) => {
  const q = (req.query as any) || {};
  const staffId = typeof q.staff_id === 'string' ? q.staff_id : undefined;
  const unassigned = q.unassigned === 'true' || q.unassigned === true;

  const whereAssign = staffId ? { staffId } : unassigned ? { staffId: null } : undefined;
  const include = { assignment: true } as const;
  let tasks;
  if (whereAssign) {
    const assigns = await prisma.assignment.findMany({ where: whereAssign, orderBy: { position: 'asc' }, select: { taskId: true, position: true, staffId: true } });
    const ids = assigns.map((a) => a.taskId);
    const list = await prisma.task.findMany({ where: { id: { in: ids } }, include });
    const map = new Map(list.map((t) => [t.id, t] as const));
    tasks = assigns.map((a) => map.get(a.taskId)!).filter(Boolean);
  } else {
    tasks = await prisma.task.findMany({ include });
  }
  return tasks;
});

app.post('/api/tasks', async (req, reply) => {
  const parse = z.object({
    name: z.string().trim().min(1),
    mandays: z.number().int().min(1),
    jiraUrl: z.string().trim().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
    theme: z.string().trim().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  }).safeParse((req as any).body);
  if (!parse.success) return reply.status(400).send({ error: 'validation_error', issues: parse.error.issues });
  const body = parse.data;

  const created = await prisma.$transaction(async (tx) => {
    const t = await tx.task.create({ data: { name: body.name, mandays: body.mandays, jiraUrl: body.jiraUrl, theme: body.theme } });
    const pos = nextPosition(await maxPosition(null));
    await tx.assignment.create({ data: { taskId: t.id, staffId: null, position: new Prisma.Decimal(pos) } });
    return t;
  });
  return created;
});

app.patch('/api/tasks/:id', async (req, reply) => {
  const { id } = (req.params as any) as { id: string };
  const parse = z.object({
    name: z.string().trim().min(1).optional(),
    mandays: z.number().int().min(1).optional(),
    jiraUrl: z.string().trim().optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
    theme: z.string().trim().optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  }).safeParse((req as any).body);
  if (!parse.success) return reply.status(400).send({ error: 'validation_error', issues: parse.error.issues });
  const body = parse.data;
  const updated = await prisma.task.update({ where: { id }, data: body });
  return updated;
});

app.delete('/api/tasks/:id', async (req) => {
  const { id } = (req.params as any) as { id: string };
  await prisma.task.delete({ where: { id } });
  return { ok: true };
});

// Move / Reorder
app.post('/api/assignments/move', async (req) => {
  const body = z.object({
    taskId: z.string().min(1),
    targetStaffId: z.string().min(1).nullable(),
    beforeTaskId: z.string().min(1).nullable().optional(),
    afterTaskId: z.string().min(1).nullable().optional(),
  }).parse((req as any).body);

  const targetStaffId = body.targetStaffId ?? null;
  let pos: number | null = null;
  const before = body.beforeTaskId ? await prisma.assignment.findUnique({ where: { taskId: body.beforeTaskId }, select: { position: true } }) : null;
  const after = body.afterTaskId ? await prisma.assignment.findUnique({ where: { taskId: body.afterTaskId }, select: { position: true } }) : null;
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
    data: { staffId: targetStaffId, position: new Prisma.Decimal(pos) }
  });
  return { ok: true, assignment: updated };
});

// Themes summary
app.get('/api/themes/summary', async () => {
  const rows = await prisma.task.groupBy({ by: ['theme'], _sum: { mandays: true }, _count: true });
  return rows
    .filter((r) => (r.theme ?? '').trim() !== '')
    .map((r) => ({ theme: r.theme!, totalMandays: r._sum.mandays ?? 0, count: r._count }))
    .sort((a, b) => b.totalMandays - a.totalMandays);
});

// Danger: clear all data (dev convenience)
app.post('/api/admin/clear', async () => {
  await prisma.$transaction([
    prisma.assignment.deleteMany({}),
    prisma.task.deleteMany({}),
    prisma.staff.deleteMany({}),
  ]);
  return { ok: true };
});

// CSV export
app.get('/api/export/csv', async (req, reply) => {
  function csvEscape(val: unknown): string {
    const s = (val ?? '').toString();
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  const header = ['name','mandays','staff','theme','jira'];
  const lines: string[] = [header.join(',')];

  const backlogAssigns = await prisma.assignment.findMany({ where: { staffId: null }, orderBy: { position: 'asc' } });
  if (backlogAssigns.length) {
    const tasks = await prisma.task.findMany({ where: { id: { in: backlogAssigns.map(a => a.taskId) } } });
    const map = new Map(tasks.map(t => [t.id, t] as const));
    for (const a of backlogAssigns) {
      const t = map.get(a.taskId); if (!t) continue;
      lines.push([csvEscape(t.name), t.mandays, '', csvEscape(t.theme ?? ''), csvEscape(t.jiraUrl ?? '')].join(','));
    }
  }

  const staff = await prisma.staff.findMany({ orderBy: { name: 'asc' } });
  for (const s of staff) {
    const assigns = await prisma.assignment.findMany({ where: { staffId: s.id }, orderBy: { position: 'asc' } });
    if (!assigns.length) continue;
    const tasks = await prisma.task.findMany({ where: { id: { in: assigns.map(a => a.taskId) } } });
    const map = new Map(tasks.map(t => [t.id, t] as const));
    for (const a of assigns) {
      const t = map.get(a.taskId); if (!t) continue;
      lines.push([csvEscape(t.name), t.mandays, csvEscape(s.name), csvEscape(t.theme ?? ''), csvEscape(t.jiraUrl ?? '')].join(','));
    }
  }

  const csv = lines.join('\r\n');
  const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  reply.header('Content-Type', 'text/csv; charset=utf-8');
  reply.header('Content-Disposition', `attachment; filename="gantt-export-${ts}.csv"`);
  return reply.send(csv);
});

// Share routes
app.post('/api/share', async (req) => {
  const token = randomUUID();
  const link = await prisma.shareLink.create({ data: { token, type: 'live', permission: 'view', viewParams: null } });
  return { token };
});

async function ensureShare(token: string) {
  const share = await prisma.shareLink.findUnique({ where: { token } });
  if (!share || share.revokedAt) throw app.httpErrors.notFound('Share not found');
  if (share.expiresAt && share.expiresAt < new Date()) throw app.httpErrors.gone('Share expired');
  return share;
}

app.get('/api/share/:token/staff', async (req) => {
  const { token } = req.params as any; await ensureShare(token);
  const staff = await prisma.staff.findMany({ orderBy: { name: 'asc' } });
  return staff;
});

app.get('/api/share/:token/tasks', async (req) => {
  const { token } = req.params as any; await ensureShare(token);
  const q = (req.query as any) || {};
  const staffId = typeof q.staff_id === 'string' ? q.staff_id : undefined;
  const unassigned = q.unassigned === 'true' || q.unassigned === true;
  const whereAssign = staffId ? { staffId } : unassigned ? { staffId: null } : undefined;
  const include = { assignment: true } as const;
  let tasks;
  if (whereAssign) {
    const assigns = await prisma.assignment.findMany({ where: whereAssign, orderBy: { position: 'asc' }, select: { taskId: true } });
    const ids = assigns.map((a) => a.taskId);
    const list = await prisma.task.findMany({ where: { id: { in: ids } }, include });
    const map = new Map(list.map((t) => [t.id, t] as const));
    tasks = assigns.map((a) => map.get(a.taskId)!).filter(Boolean);
  } else {
    tasks = await prisma.task.findMany({ include });
  }
  return tasks;
});

app.get('/api/share/:token/themes/summary', async (req) => {
  const { token } = req.params as any; await ensureShare(token);
  const rows = await prisma.task.groupBy({ by: ['theme'], _sum: { mandays: true }, _count: true });
  return rows
    .filter((r) => (r.theme ?? '').trim() !== '')
    .map((r) => ({ theme: r.theme!, totalMandays: r._sum.mandays ?? 0, count: r._count }))
    .sort((a, b) => b.totalMandays - a.totalMandays);
});

// Vercel serverless handler
export default async (req: VercelRequest, res: VercelResponse) => {
  await app.ready();
  app.server.emit('request', req, res);
};