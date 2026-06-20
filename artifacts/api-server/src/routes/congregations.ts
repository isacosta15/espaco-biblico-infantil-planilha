import { Router } from "express";
import { db, congregationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateCongregationBody,
  GetCongregationParams,
  UpdateCongregationParams,
  UpdateCongregationBody,
  DeleteCongregationParams,
  ListCongregationsResponse,
  GetCongregationResponse,
  UpdateCongregationResponse,
} from "@workspace/api-zod";
import { authMiddleware } from "../lib/auth";

const router = Router();

router.get("/congregations", authMiddleware, async (_req, res): Promise<void> => {
  const rows = await db.select().from(congregationsTable).orderBy(congregationsTable.name);
  res.json(ListCongregationsResponse.parse(rows));
});

router.post("/congregations", authMiddleware, async (req, res): Promise<void> => {
  const parsed = CreateCongregationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [congregation] = await db.insert(congregationsTable).values(parsed.data).returning();
  res.status(201).json(GetCongregationResponse.parse(congregation));
});

router.get("/congregations/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = GetCongregationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [congregation] = await db.select().from(congregationsTable).where(eq(congregationsTable.id, params.data.id));
  if (!congregation) {
    res.status(404).json({ error: "Congregação não encontrada" });
    return;
  }
  res.json(GetCongregationResponse.parse(congregation));
});

router.patch("/congregations/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = UpdateCongregationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCongregationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [congregation] = await db
    .update(congregationsTable)
    .set(parsed.data)
    .where(eq(congregationsTable.id, params.data.id))
    .returning();
  if (!congregation) {
    res.status(404).json({ error: "Congregação não encontrada" });
    return;
  }
  res.json(UpdateCongregationResponse.parse(congregation));
});

router.delete("/congregations/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = DeleteCongregationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(congregationsTable).where(eq(congregationsTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Congregação não encontrada" });
    return;
  }
  res.sendStatus(204);
});

export default router;
