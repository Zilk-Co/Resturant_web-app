import { Router, type IRouter, type Request, type Response } from "express";
import pool from "../db.js";
import { adminAuth } from "./admin.js";

const router: IRouter = Router();

const DEFAULT_SETTINGS = {
  storeName: "The Hunger Bite Istanbul",
  storePhone: "03121129700",
  taxRate: 17,
  deliveryFee: 99,
  minOrderAmount: 500,
  freeDeliveryOver: 2000,
  takeawayDiscount: 10,
  preparationTime: 15,
  deliveryTime: 45,
  deliveryEnabled: true,
  takeawayEnabled: true,
  maxDeliveryRadius: 5,
};

async function loadSettings(): Promise<any> {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key = 'store'");
    if (rows.length > 0) return rows[0].value;
  } catch {}
  return DEFAULT_SETTINGS;
}

// ── Public: settings for app + website ──────────────────────────────

router.get("/mobile/settings", async (_req: Request, res: Response): Promise<void> => {
  const settings = await loadSettings();
  res.json(settings);
});

// ── Admin: settings ─────────────────────────────────────────────────

router.get("/admin/settings", async (_req: Request, res: Response): Promise<void> => {
  const settings = await loadSettings();
  res.json(settings);
});

router.patch("/admin/settings", adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const current = await loadSettings();
    const updated = { ...current, ...req.body };
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ('store', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [JSON.stringify(updated)]
    );
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
