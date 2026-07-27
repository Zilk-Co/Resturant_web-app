import { Router, type IRouter, type Request, type Response } from "express";
import pool from "../db.js";
import { adminAuth } from "./admin.js";

const router: IRouter = Router();

function dbBannerToCamel(row: any) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    tag: row.tag,
    tagColor: row.tag_color,
    gradStart: row.grad_start,
    gradEnd: row.grad_end,
    ctaLabel: row.cta_label,
    ctaCat: row.cta_cat,
    imageUrl: row.image_url,
    active: row.active,
    sortOrder: row.sort_order,
  };
}

function camelToDbBanner(body: any) {
  const map: Record<string, string> = {
    title: "title", subtitle: "subtitle", tag: "tag",
    tagColor: "tag_color", gradStart: "grad_start", gradEnd: "grad_end",
    ctaLabel: "cta_label", ctaCat: "cta_cat", imageUrl: "image_url",
    active: "active", sortOrder: "sort_order",
  };
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(body)) {
    const dbKey = map[key] || key;
    result[dbKey] = val;
  }
  return result;
}

// ── Public: active banners for app ──────────────────────────────────

router.get("/mobile/banners", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query("SELECT * FROM banners WHERE active = true ORDER BY sort_order");
    res.json(rows.map(dbBannerToCamel));
  } catch {
    res.json([]);
  }
});

// ── Admin: all banners ──────────────────────────────────────────────

router.get("/admin/banners", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query("SELECT * FROM banners ORDER BY sort_order");
    res.json(rows.map(dbBannerToCamel));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/admin/banners", adminAuth, async (req: Request, res: Response): Promise<void> => {
  const { title, subtitle, tag, tagColor, gradStart, gradEnd, ctaLabel, ctaCat, imageUrl, active, sortOrder } = req.body;
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO banners (id, title, subtitle, tag, tag_color, grad_start, grad_end, cta_label, cta_cat, image_url, active, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [`b${Date.now()}`, title || "", subtitle || "", tag || "", tagColor || "#FFD54F",
       gradStart || "#C8102E", gradEnd || "#8B0000", ctaLabel || "Order Now",
       ctaCat || "deals", imageUrl || "", active !== false, sortOrder ?? 0]
    );
    res.status(201).json(dbBannerToCamel(rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/banners/:id", adminAuth, async (req: Request, res: Response): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  try {
    const dbFields = camelToDbBanner(req.body);
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(dbFields)) {
      if (key === "id") continue;
      fields.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    if (fields.length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
    values.push(rawId);
    const { rows } = await pool.query(`UPDATE banners SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`, values);
    if (rows.length === 0) { res.status(404).json({ error: "Banner not found" }); return; }
    res.json(dbBannerToCamel(rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/admin/banners/:id", adminAuth, async (req: Request, res: Response): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  try {
    const { rowCount } = await pool.query("DELETE FROM banners WHERE id = $1", [rawId]);
    if (rowCount === 0) { res.status(404).json({ error: "Banner not found" }); return; }
    res.sendStatus(204);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
