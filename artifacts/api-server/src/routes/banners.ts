import { Router, type IRouter, type Request, type Response } from "express";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { adminAuth } from "./admin";

const router: IRouter = Router();

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  gradStart: string;
  gradEnd: string;
  ctaLabel: string;
  ctaCat: string;
  imageUrl: string;
  active: boolean;
  sortOrder: number;
};

const DATA_DIR = join(process.cwd(), "data");
const BANNERS_FILE = join(DATA_DIR, "banners.json");

const DEFAULT_BANNERS: Banner[] = [
  {
    id: "s1",
    title: "Big Deals, Bigger Savings",
    subtitle: "Save up to 40% on family meals",
    tag: " LIMITED TIME",
    tagColor: "#FFD54F",
    gradStart: "#C8102E",
    gradEnd: "#8B0000",
    ctaLabel: "Order Now",
    ctaCat: "deals",
    imageUrl: "/images/hero-banner.png",
    active: true,
    sortOrder: 0,
  },
  {
    id: "s2",
    title: "Istanbul Zinger Burger",
    subtitle: "Crispy, spicy, irresistible",
    tag: " BESTSELLER",
    tagColor: "#FF6B35",
    gradStart: "#FF6B35",
    gradEnd: "#D32F2F",
    ctaLabel: "View Menu",
    ctaCat: "burgers",
    imageUrl: "/images/burger.png",
    active: true,
    sortOrder: 1,
  },
  {
    id: "s3",
    title: "Crispy Chicken",
    subtitle: "Golden fried perfection",
    tag: " POPULAR",
    tagColor: "#4CAF50",
    gradStart: "#2E7D32",
    gradEnd: "#1B5E20",
    ctaLabel: "Order Now",
    ctaCat: "chicken",
    imageUrl: "/images/chicken.png",
    active: true,
    sortOrder: 2,
  },
];

async function loadBanners(): Promise<Banner[]> {
  try {
    const raw = await readFile(BANNERS_FILE, "utf-8");
    return JSON.parse(raw) as Banner[];
  } catch {
    await saveBanners(DEFAULT_BANNERS);
    return DEFAULT_BANNERS;
  }
}

async function saveBanners(banners: Banner[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(BANNERS_FILE, JSON.stringify(banners, null, 2), "utf-8");
}

// ── Public: active banners for app ──────────────────────────────────

router.get("/mobile/banners", async (_req: Request, res: Response): Promise<void> => {
  const banners = await loadBanners();
  res.json(banners.filter((b) => b.active).sort((a, b) => a.sortOrder - b.sortOrder));
});

// ── Admin: all banners ──────────────────────────────────────────────

router.get("/admin/banners", async (_req: Request, res: Response): Promise<void> => {
  const banners = await loadBanners();
  res.json(banners.sort((a, b) => a.sortOrder - b.sortOrder));
});

router.post("/admin/banners", adminAuth, async (req: Request, res: Response): Promise<void> => {
  const { title, subtitle, tag, tagColor, gradStart, gradEnd, ctaLabel, ctaCat, imageUrl, active, sortOrder } = req.body;
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const banners = await loadBanners();
  const newBanner: Banner = {
    id: `b${Date.now()}`,
    title: title || "",
    subtitle: subtitle || "",
    tag: tag || "",
    tagColor: tagColor || "#FFD54F",
    gradStart: gradStart || "#C8102E",
    gradEnd: gradEnd || "#8B0000",
    ctaLabel: ctaLabel || "Order Now",
    ctaCat: ctaCat || "deals",
    imageUrl: imageUrl || "",
    active: active !== false,
    sortOrder: sortOrder ?? banners.length,
  };
  banners.push(newBanner);
  await saveBanners(banners);
  res.status(201).json(newBanner);
});

router.patch("/admin/banners/:id", adminAuth, async (req: Request, res: Response): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const banners = await loadBanners();
  const idx = banners.findIndex((b) => b.id === rawId);
  if (idx === -1) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }
  banners[idx] = { ...banners[idx], ...req.body, id: rawId };
  await saveBanners(banners);
  res.json(banners[idx]);
});

router.delete("/admin/banners/:id", adminAuth, async (req: Request, res: Response): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const banners = await loadBanners();
  const filtered = banners.filter((b) => b.id !== rawId);
  if (filtered.length === banners.length) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }
  await saveBanners(filtered);
  res.sendStatus(204);
});

export default router;
