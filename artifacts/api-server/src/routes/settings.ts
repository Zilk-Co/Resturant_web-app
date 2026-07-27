import { Router, type IRouter, type Request, type Response } from "express";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { adminAuth } from "./admin";

const router: IRouter = Router();

type Settings = {
  storeName: string;
  storePhone: string;
  taxRate: number;
  deliveryFee: number;
  minOrderAmount: number;
  freeDeliveryOver: number;
  takeawayDiscount: number;
  preparationTime: number;
  deliveryTime: number;
  deliveryEnabled: boolean;
  takeawayEnabled: boolean;
  maxDeliveryRadius: number;
};

const DATA_DIR = join(process.cwd(), "data");
const SETTINGS_FILE = join(DATA_DIR, "settings.json");

const DEFAULT_SETTINGS: Settings = {
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

async function loadSettings(): Promise<Settings> {
  try {
    const raw = await readFile(SETTINGS_FILE, "utf-8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    await saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(settings: Settings): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
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
  const current = await loadSettings();
  const updated = { ...current, ...req.body };
  await saveSettings(updated);
  res.json(updated);
});

export default router;
