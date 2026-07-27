import { Router, type IRouter, type Request, type Response } from "express";
import pool from "../db.js";
import { adminAuth } from "./admin.js";

const router: IRouter = Router();

// ── Public: content for website ─────────────────────────────────────

router.get("/mobile/website-content", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query("SELECT * FROM website_content ORDER BY section, key");
    res.json(rows);
  } catch {
    res.json([]);
  }
});

// ── Admin: all content ──────────────────────────────────────────────

router.get("/admin/website-content", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query("SELECT * FROM website_content ORDER BY section, key");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/website-content/:key", adminAuth, async (req: Request, res: Response): Promise<void> => {
  const rawKey = Array.isArray(req.params["key"]) ? req.params["key"][0] : req.params["key"];
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(req.body)) {
      if (key === "key") continue;
      fields.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    if (fields.length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
    values.push(rawKey);
    const { rows } = await pool.query(`UPDATE website_content SET ${fields.join(", ")} WHERE key = $${idx} RETURNING *`, values);
    if (rows.length === 0) { res.status(404).json({ error: "Content block not found" }); return; }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/admin/website-content", adminAuth, async (req: Request, res: Response): Promise<void> => {
  const { key, label, value, section } = req.body;
  if (!key || !label) {
    res.status(400).json({ error: "key and label are required" });
    return;
  }
  try {
    const { rows: existing } = await pool.query("SELECT key FROM website_content WHERE key = $1", [key]);
    if (existing.length > 0) {
      res.status(409).json({ error: "A content block with this key already exists" });
      return;
    }
    const { rows } = await pool.query(
      "INSERT INTO website_content (key, label, value, section) VALUES ($1,$2,$3,$4) RETURNING *",
      [key, label, value || "", section || "general"]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/admin/website-content/:key", adminAuth, async (req: Request, res: Response): Promise<void> => {
  const rawKey = Array.isArray(req.params["key"]) ? req.params["key"][0] : req.params["key"];
  try {
    const { rowCount } = await pool.query("DELETE FROM website_content WHERE key = $1", [rawKey]);
    if (rowCount === 0) { res.status(404).json({ error: "Content block not found" }); return; }
    res.sendStatus(204);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
