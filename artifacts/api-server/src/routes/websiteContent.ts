import { Router, type IRouter, type Request, type Response } from "express";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { adminAuth } from "./admin";

const router: IRouter = Router();

type ContentBlock = {
  key: string;
  label: string;
  value: string;
  section: string;
};

const DATA_DIR = join(process.cwd(), "data");
const CONTENT_FILE = join(DATA_DIR, "website-content.json");

const DEFAULT_CONTENT: ContentBlock[] = [
  { key: "hero_title", label: "Hero Title", value: "Fresh, Halal Chicken", section: "hero" },
  { key: "hero_subtitle", label: "Hero Subtitle", value: "Delivered to You", section: "hero" },
  { key: "hero_cta", label: "Hero CTA Button", value: "Order Now", section: "hero" },
  { key: "about_title", label: "About Title", value: "The Hunger Bite Istanbul", section: "about" },
  { key: "about_description", label: "About Description", value: "We serve the freshest, halal-certified chicken dishes made with premium ingredients and our signature spice blends. Inspired by Turkish culinary traditions with a Pakistani heart, every bite is a commitment to quality and taste.", section: "about" },
  { key: "about_mission", label: "Mission Statement", value: "To bring authentic, high-quality halal food to every table while maintaining our commitment to exceptional taste — blending Turkish culinary art with Pakistani hospitality.", section: "about" },
  { key: "footer_copyright", label: "Footer Copyright", value: "2026 The Hunger Bite Istanbul. All rights reserved.", section: "footer" },
  { key: "footer_phone", label: "Footer Phone", value: "03121129700", section: "footer" },
  { key: "footer_email", label: "Footer Email", value: "info@thehungerbite.com", section: "footer" },
  { key: "footer_address", label: "Footer Address", value: "Sector 4, Naval Colony, Karachi", section: "footer" },
  { key: "contact_phone", label: "Contact Phone", value: "03121129700", section: "contact" },
  { key: "contact_email", label: "Contact Email", value: "info@thehungerbite.com", section: "contact" },
  { key: "contact_hours", label: "Working Hours", value: "10:00 AM - 12:00 AM", section: "contact" },
  { key: "cta_title", label: "CTA Title", value: "Ready to Order?", section: "cta" },
  { key: "cta_subtitle", label: "CTA Subtitle", value: "Fresh, halal-certified food delivered to your doorstep", section: "cta" },
  { key: "cta_button", label: "CTA Button Text", value: "Explore Menu", section: "cta" },
  { key: "story_hero_tagline", label: "Story Hero Tagline", value: "From Pakistan With Turkish Inspiration", section: "story" },
  { key: "story_ceo_tagline", label: "Story CEO Tagline", value: "Made with heart by the THB Culinary Team", section: "story" },
];

async function loadContent(): Promise<ContentBlock[]> {
  try {
    const raw = await readFile(CONTENT_FILE, "utf-8");
    return JSON.parse(raw) as ContentBlock[];
  } catch {
    await saveContent(DEFAULT_CONTENT);
    return DEFAULT_CONTENT;
  }
}

async function saveContent(blocks: ContentBlock[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CONTENT_FILE, JSON.stringify(blocks, null, 2), "utf-8");
}

// ── Public: content for website ─────────────────────────────────────

router.get("/mobile/website-content", async (_req: Request, res: Response): Promise<void> => {
  const blocks = await loadContent();
  res.json(blocks);
});

// ── Admin: all content ──────────────────────────────────────────────

router.get("/admin/website-content", async (_req: Request, res: Response): Promise<void> => {
  const blocks = await loadContent();
  res.json(blocks);
});

router.patch("/admin/website-content/:key", adminAuth, async (req: Request, res: Response): Promise<void> => {
  const rawKey = Array.isArray(req.params["key"]) ? req.params["key"][0] : req.params["key"];
  const blocks = await loadContent();
  const idx = blocks.findIndex((b) => b.key === rawKey);
  if (idx === -1) {
    res.status(404).json({ error: "Content block not found" });
    return;
  }
  blocks[idx] = { ...blocks[idx], ...req.body, key: rawKey };
  await saveContent(blocks);
  res.json(blocks[idx]);
});

router.post("/admin/website-content", adminAuth, async (req: Request, res: Response): Promise<void> => {
  const { key, label, value, section } = req.body;
  if (!key || !label) {
    res.status(400).json({ error: "key and label are required" });
    return;
  }
  const blocks = await loadContent();
  const exists = blocks.some((b) => b.key === key);
  if (exists) {
    res.status(409).json({ error: "A content block with this key already exists" });
    return;
  }
  const newBlock: ContentBlock = { key, label, value: value || "", section: section || "general" };
  blocks.push(newBlock);
  await saveContent(blocks);
  res.status(201).json(newBlock);
});

router.delete("/admin/website-content/:key", adminAuth, async (req: Request, res: Response): Promise<void> => {
  const rawKey = Array.isArray(req.params["key"]) ? req.params["key"][0] : req.params["key"];
  const blocks = await loadContent();
  const filtered = blocks.filter((b) => b.key !== rawKey);
  if (filtered.length === blocks.length) {
    res.status(404).json({ error: "Content block not found" });
    return;
  }
  await saveContent(filtered);
  res.sendStatus(204);
});

export default router;
