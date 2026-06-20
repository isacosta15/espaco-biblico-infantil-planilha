import { Router } from "express";
import { db, dailyReportsTable, childrenTable, attendanceTable } from "@workspace/db";
import { eq, sql, and, count, gte, lte } from "drizzle-orm";
import { ListDailyReportsQueryParams, GetDailyReportParams } from "@workspace/api-zod";
import { authMiddleware } from "../lib/auth";

const router = Router();

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

router.get("/reports/daily", authMiddleware, async (req, res): Promise<void> => {
  const params = ListDailyReportsQueryParams.safeParse(req.query);
  let query = db.select().from(dailyReportsTable).$dynamic();

  if (params.success) {
    const conditions = [];
    if (params.data.startDate) {
      conditions.push(gte(dailyReportsTable.reportDate, params.data.startDate));
    }
    if (params.data.endDate) {
      conditions.push(lte(dailyReportsTable.reportDate, params.data.endDate));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
  }

  const rows = await query.orderBy(sql`${dailyReportsTable.reportDate} DESC`);
  res.json(rows);
});

router.get("/reports/daily/:date", authMiddleware, async (req, res): Promise<void> => {
  const params = GetDailyReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [report] = await db.select().from(dailyReportsTable)
    .where(eq(dailyReportsTable.reportDate, params.data.date));
  if (!report) {
    res.status(404).json({ error: "Relatório não encontrado" });
    return;
  }
  res.json(report);
});

router.get("/dashboard/stats", authMiddleware, async (_req, res): Promise<void> => {
  const todayStr = getTodayStr();

  const [totalRow] = await db.select({ cnt: count() }).from(childrenTable);
  const [girlsRow] = await db.select({ cnt: count() }).from(childrenTable).where(eq(childrenTable.gender, "F"));
  const [boysRow] = await db.select({ cnt: count() }).from(childrenTable).where(eq(childrenTable.gender, "M"));

  const [todayGirlsRow] = await db.select({ cnt: count() }).from(attendanceTable)
    .innerJoin(childrenTable, eq(attendanceTable.childId, childrenTable.id))
    .where(and(eq(attendanceTable.attendanceDate, todayStr), eq(childrenTable.gender, "F")));
  const [todayBoysRow] = await db.select({ cnt: count() }).from(attendanceTable)
    .innerJoin(childrenTable, eq(attendanceTable.childId, childrenTable.id))
    .where(and(eq(attendanceTable.attendanceDate, todayStr), eq(childrenTable.gender, "M")));

  const totalChildren = Number(totalRow?.cnt ?? 0);
  const totalGirls = Number(girlsRow?.cnt ?? 0);
  const totalBoys = Number(boysRow?.cnt ?? 0);
  const todayGirls = Number(todayGirlsRow?.cnt ?? 0);
  const todayBoys = Number(todayBoysRow?.cnt ?? 0);
  const presentToday = todayGirls + todayBoys;
  const absentToday = totalChildren - presentToday;

  // Weekly average: average of last 8 weekly reports
  const recentReports = await db.select({ total: dailyReportsTable.totalChildren })
    .from(dailyReportsTable)
    .orderBy(sql`${dailyReportsTable.reportDate} DESC`)
    .limit(8);
  const weeklyAverage = recentReports.length > 0
    ? recentReports.reduce((sum, r) => sum + r.total, 0) / recentReports.length
    : 0;

  res.json({
    totalChildren,
    totalGirls,
    totalBoys,
    presentToday,
    absentToday,
    todayGirls,
    todayBoys,
    weeklyAverage: Math.round(weeklyAverage * 10) / 10,
  });
});

router.get("/dashboard/weekly", authMiddleware, async (_req, res): Promise<void> => {
  const rows = await db.select().from(dailyReportsTable)
    .orderBy(sql`${dailyReportsTable.reportDate} DESC`)
    .limit(8);

  const result = rows.reverse().map((r) => ({
    weekLabel: new Date(r.reportDate + "T12:00:00Z").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    reportDate: r.reportDate,
    totalChildren: r.totalChildren,
    totalGirls: r.totalGirls,
    totalBoys: r.totalBoys,
  }));

  res.json(result);
});

export default router;
