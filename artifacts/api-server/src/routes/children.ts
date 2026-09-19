import { Router, type Request, type Response } from "express";
import { db, childrenTable, congregationsTable, attendanceTable, usersTable } from "@workspace/db";
import { eq, ilike, sql, and, count, max, isNull, isNotNull, lte } from "drizzle-orm";
import {
  ListChildrenQueryParams,
  CreateChildBody,
  GetChildParams,
  UpdateChildParams,
  UpdateChildBody,
  DeleteChildParams,
  GetMostAbsentChildrenQueryParams,
} from "@workspace/api-zod";
import { authMiddleware } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";

const router = Router();

function calcAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getUser(req: Request): JwtPayload {
  return (req as typeof req & { user: JwtPayload }).user;
}

function requireAdmin(req: Request, res: Response): boolean {
  if (getUser(req).role !== "admin") {
    res.status(403).json({ error: "Apenas administradores podem acessar a lixeira." });
    return false;
  }
  return true;
}

function toDateString(value: string | Date): string {
  return value instanceof Date ? value.toISOString().split("T")[0] : value;
}

async function purgeExpiredDeletedChildren(): Promise<void> {
  const expired = await db.select({ id: childrenTable.id })
    .from(childrenTable)
    .where(and(isNotNull(childrenTable.deletedAt), lte(childrenTable.deletionExpiresAt, new Date())));

  for (const child of expired) {
    await db.delete(attendanceTable).where(eq(attendanceTable.childId, child.id));
    await db.delete(childrenTable).where(eq(childrenTable.id, child.id));
  }
}

async function enrichChild(child: typeof childrenTable.$inferSelect, todayStr: string) {
  let congregationName: string | null = null;
  if (child.congregationId) {
    const [cong] = await db.select({ name: congregationsTable.name })
      .from(congregationsTable)
      .where(eq(congregationsTable.id, child.congregationId));
    congregationName = cong?.name ?? null;
  }
  const [att] = await db.select({ id: attendanceTable.id })
    .from(attendanceTable)
    .where(and(eq(attendanceTable.childId, child.id), eq(attendanceTable.attendanceDate, todayStr)));
  return {
    ...child,
    age: calcAge(child.birthDate),
    congregationName,
    presentToday: !!att,
  };
}

router.get("/children/birthdays", authMiddleware, async (_req, res): Promise<void> => {
  await purgeExpiredDeletedChildren();
  const today = new Date();
  const month = today.getMonth() + 1;
  const todayStr = getTodayStr();
  const rows = await db.select().from(childrenTable)
    .where(and(isNull(childrenTable.deletedAt), sql`EXTRACT(MONTH FROM ${childrenTable.birthDate}::date) = ${month}`))
    .orderBy(sql`EXTRACT(DAY FROM ${childrenTable.birthDate}::date)`);
  const enriched = await Promise.all(rows.map((c) => enrichChild(c, todayStr)));
  res.json(enriched);
});

router.get("/children/most-absent", authMiddleware, async (req, res): Promise<void> => {
  await purgeExpiredDeletedChildren();
  const params = GetMostAbsentChildrenQueryParams.safeParse(req.query);
  const limit = params.success && params.data.limit ? params.data.limit : 10;
  const todayStr = getTodayStr();

  // Get all children with their attendance counts
  const rows = await db.select().from(childrenTable).where(isNull(childrenTable.deletedAt)).orderBy(childrenTable.fullName);

  const enrichedWithFreq = await Promise.all(rows.map(async (child) => {
    let congregationName: string | null = null;
    if (child.congregationId) {
      const [cong] = await db.select({ name: congregationsTable.name })
        .from(congregationsTable)
        .where(eq(congregationsTable.id, child.congregationId));
      congregationName = cong?.name ?? null;
    }
    const [att] = await db.select({ id: attendanceTable.id })
      .from(attendanceTable)
      .where(and(eq(attendanceTable.childId, child.id), eq(attendanceTable.attendanceDate, todayStr)));

    const [presCount] = await db.select({ cnt: count() }).from(attendanceTable)
      .where(eq(attendanceTable.childId, child.id));
    const [lastPres] = await db.select({ d: max(attendanceTable.attendanceDate) })
      .from(attendanceTable)
      .where(eq(attendanceTable.childId, child.id));

    const presenceCount = presCount?.cnt ?? 0;

    // Count distinct dates with attendance overall to calc absences
    const [totalDates] = await db.select({ cnt: count(sql`DISTINCT ${attendanceTable.attendanceDate}`) })
      .from(attendanceTable);
    const totalSessions = totalDates?.cnt ?? 0;
    const absenceCount = Number(totalSessions) - Number(presenceCount);

    return {
      ...child,
      age: calcAge(child.birthDate),
      congregationName,
      presentToday: !!att,
      presenceCount: Number(presenceCount),
      absenceCount: Math.max(0, absenceCount),
      lastPresence: lastPres?.d ?? null,
    };
  }));

  const sorted = enrichedWithFreq.sort((a, b) => b.absenceCount - a.absenceCount).slice(0, limit);
  res.json(sorted);
});

router.get("/children", authMiddleware, async (req, res): Promise<void> => {
  await purgeExpiredDeletedChildren();
  const params = ListChildrenQueryParams.safeParse(req.query);
  const todayStr = getTodayStr();

  let query = db.select().from(childrenTable);
  const conditions = [isNull(childrenTable.deletedAt)];

  if (params.success) {
    const p = params.data;
    if (p.search) {
      conditions.push(ilike(childrenTable.fullName, `%${p.search}%`));
    }
    if (p.gender) {
      conditions.push(eq(childrenTable.gender, p.gender as "M" | "F"));
    }
    if (p.congregationId) {
      conditions.push(eq(childrenTable.congregationId, p.congregationId));
    }
    if (p.autism === true || p.autism === "true" as unknown) {
      conditions.push(eq(childrenTable.autism, true));
    }
    if (p.foodRestriction === true || p.foodRestriction === "true" as unknown) {
      conditions.push(eq(childrenTable.foodRestriction, true));
    }
    if (p.ageAbove12 === true || p.ageAbove12 === "true" as unknown) {
      conditions.push(sql`EXTRACT(YEAR FROM AGE(${childrenTable.birthDate}::date)) >= 12`);
    }
  }

  const rows = await (conditions.length > 0
    ? query.where(and(...conditions))
    : query)
    .$dynamic().orderBy(childrenTable.fullName);

  const enriched = await Promise.all(rows.map((c) => enrichChild(c, todayStr)));

  let result = enriched;
  if (params.success) {
    const p = params.data;
    if (p.presentToday === true || p.presentToday === "true" as unknown) {
      result = result.filter((c) => c.presentToday);
    }
    if (p.absentToday === true || p.absentToday === "true" as unknown) {
      result = result.filter((c) => !c.presentToday);
    }
  }

  res.json(result);
});

router.get("/children/deleted", authMiddleware, async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  await purgeExpiredDeletedChildren();
  const rows = await db.select({
    child: childrenTable,
    deletedByName: usersTable.name,
  })
    .from(childrenTable)
    .leftJoin(usersTable, eq(childrenTable.deletedBy, usersTable.id))
    .where(isNotNull(childrenTable.deletedAt))
    .orderBy(sql`${childrenTable.deletedAt} DESC`);

  res.json(rows.map(({ child, deletedByName }) => ({
    ...child,
    age: calcAge(child.birthDate),
    presentToday: false,
    deletedByName: deletedByName ?? null,
  })));
});

router.post("/children", authMiddleware, async (req, res): Promise<void> => {
  const parsed = CreateChildBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [child] = await db.insert(childrenTable).values({
    ...parsed.data,
    birthDate: toDateString(parsed.data.birthDate),
  } as unknown as typeof childrenTable.$inferInsert).returning();
  const todayStr = getTodayStr();
  const enriched = await enrichChild(child, todayStr);
  res.status(201).json(enriched);
});

router.post("/children/:id/restore", authMiddleware, async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const params = GetChildParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [child] = await db.update(childrenTable)
    .set({ deletedAt: null, deletedBy: null, deletionExpiresAt: null })
    .where(and(eq(childrenTable.id, params.data.id), isNotNull(childrenTable.deletedAt)))
    .returning();
  if (!child) {
    res.status(404).json({ error: "Cadastro excluído não encontrado ou já restaurado." });
    return;
  }
  res.json(await enrichChild(child, getTodayStr()));
});

router.get("/children/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = GetChildParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [child] = await db.select().from(childrenTable)
    .where(and(eq(childrenTable.id, params.data.id), isNull(childrenTable.deletedAt)));
  if (!child) {
    res.status(404).json({ error: "Criança não encontrada" });
    return;
  }
  const todayStr = getTodayStr();
  const enriched = await enrichChild(child, todayStr);
  res.json(enriched);
});

router.patch("/children/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = UpdateChildParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateChildBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [child] = await db.update(childrenTable).set({
    ...parsed.data,
    ...(parsed.data.birthDate ? { birthDate: toDateString(parsed.data.birthDate) } : {}),
  } as unknown as Partial<typeof childrenTable.$inferInsert>)
    .where(and(eq(childrenTable.id, params.data.id), isNull(childrenTable.deletedAt))).returning();
  if (!child) {
    res.status(404).json({ error: "Criança não encontrada" });
    return;
  }
  const todayStr = getTodayStr();
  const enriched = await enrichChild(child, todayStr);
  res.json(enriched);
});

router.delete("/children/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = DeleteChildParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const user = getUser(req);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [deleted] = await db.update(childrenTable).set({
    deletedAt: now,
    deletedBy: user.userId,
    deletionExpiresAt: expiresAt,
  }).where(and(eq(childrenTable.id, params.data.id), isNull(childrenTable.deletedAt))).returning();
  if (!deleted) {
    res.status(404).json({ error: "Criança não encontrada" });
    return;
  }
  res.sendStatus(204);
});

router.get("/children/:id/frequency", authMiddleware, async (req, res): Promise<void> => {
  const params = GetChildParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const childId = params.data.id;
  const [presCount] = await db.select({ cnt: count() }).from(attendanceTable)
    .where(eq(attendanceTable.childId, childId));
  const [lastPres] = await db.select({ d: max(attendanceTable.attendanceDate) })
    .from(attendanceTable).where(eq(attendanceTable.childId, childId));
  const [totalDates] = await db.select({ cnt: count(sql`DISTINCT ${attendanceTable.attendanceDate}`) })
    .from(attendanceTable);

  const presenceCount = Number(presCount?.cnt ?? 0);
  const totalSessions = Number(totalDates?.cnt ?? 0);
  const absenceCount = Math.max(0, totalSessions - presenceCount);
  const frequencyPercent = totalSessions > 0 ? Math.round((presenceCount / totalSessions) * 100) : 0;

  res.json({
    childId,
    presenceCount,
    absenceCount,
    frequencyPercent,
    lastPresence: lastPres?.d ?? null,
  });
});

router.get("/children/:id/attendance", authMiddleware, async (req, res): Promise<void> => {
  const params = GetChildParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db.select().from(attendanceTable)
    .where(eq(attendanceTable.childId, params.data.id))
    .orderBy(sql`${attendanceTable.attendanceDate} DESC`);
  res.json(rows);
});

export default router;
