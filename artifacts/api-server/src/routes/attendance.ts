import { Router } from "express";
import { db, attendanceTable, childrenTable, congregationsTable, dailyReportsTable } from "@workspace/db";
import { eq, and, sql, count } from "drizzle-orm";
import { MarkAttendanceBody, ListAttendanceQueryParams } from "@workspace/api-zod";
import { authMiddleware } from "../lib/auth";

const router = Router();

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function calcAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

async function updateDailyReport(date: string): Promise<void> {
  const girlsCount = await db.select({ cnt: count() }).from(attendanceTable)
    .innerJoin(childrenTable, eq(attendanceTable.childId, childrenTable.id))
    .where(and(eq(attendanceTable.attendanceDate, date), eq(childrenTable.gender, "F")));
  const boysCount = await db.select({ cnt: count() }).from(attendanceTable)
    .innerJoin(childrenTable, eq(attendanceTable.childId, childrenTable.id))
    .where(and(eq(attendanceTable.attendanceDate, date), eq(childrenTable.gender, "M")));

  const totalGirls = Number(girlsCount[0]?.cnt ?? 0);
  const totalBoys = Number(boysCount[0]?.cnt ?? 0);
  const totalChildren = totalGirls + totalBoys;

  await db.insert(dailyReportsTable).values({
    reportDate: date,
    totalGirls,
    totalBoys,
    totalChildren,
  }).onConflictDoUpdate({
    target: dailyReportsTable.reportDate,
    set: { totalGirls, totalBoys, totalChildren },
  });
}

router.get("/attendance/dates", authMiddleware, async (_req, res): Promise<void> => {
  const rows = await db.select().from(dailyReportsTable).orderBy(sql`${dailyReportsTable.reportDate} DESC`);
  res.json(rows);
});

router.get("/attendance", authMiddleware, async (req, res): Promise<void> => {
  const params = ListAttendanceQueryParams.safeParse(req.query);
  const todayStr = getTodayStr();
  const dateFilter = (params.success && params.data.date) ? params.data.date : todayStr;

  const rows = await db.select().from(attendanceTable)
    .innerJoin(childrenTable, eq(attendanceTable.childId, childrenTable.id))
    .where(eq(attendanceTable.attendanceDate, dateFilter))
    .orderBy(attendanceTable.attendanceTime);

  const enriched = await Promise.all(rows.map(async (row) => {
    const child = row.children;
    let congregationName: string | null = null;
    if (child.congregationId) {
      const [cong] = await db.select({ name: congregationsTable.name })
        .from(congregationsTable)
        .where(eq(congregationsTable.id, child.congregationId));
      congregationName = cong?.name ?? null;
    }
    return {
      ...row.attendance,
      child: {
        ...child,
        age: calcAge(child.birthDate),
        congregationName,
        presentToday: true,
      },
    };
  }));

  res.json(enriched);
});

router.delete("/attendance/today/:childId", authMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.childId) ? req.params.childId[0] : req.params.childId;
  const childId = parseInt(raw, 10);
  if (isNaN(childId)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const todayStr = getTodayStr();
  const [deleted] = await db.delete(attendanceTable)
    .where(and(eq(attendanceTable.childId, childId), eq(attendanceTable.attendanceDate, todayStr)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Presença não encontrada para hoje" });
    return;
  }
  await updateDailyReport(todayStr);
  res.sendStatus(204);
});

router.post("/attendance", authMiddleware, async (req, res): Promise<void> => {
  const parsed = MarkAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const date = parsed.data.attendanceDate ?? getTodayStr();
  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 8);

  // Check for duplicate
  const [existing] = await db.select().from(attendanceTable)
    .where(and(
      eq(attendanceTable.childId, parsed.data.childId),
      eq(attendanceTable.attendanceDate, date)
    ));
  if (existing) {
    res.status(409).json({ error: "Presença já registrada para este dia" });
    return;
  }

  const [attendance] = await db.insert(attendanceTable).values({
    childId: parsed.data.childId,
    attendanceDate: date,
    attendanceTime: timeStr,
  }).returning();

  await updateDailyReport(date);

  res.status(201).json(attendance);
});

export default router;
