import { Router } from "express";
import fs from "fs";
import path from "path";
import { adminAuth } from "./admin";

const router = Router();
const DATA_FILE = path.join(process.cwd(), "data", "reviews.json");

const BANNED_WORDS = [
  "fuck", "shit", "damn", "ass", "bitch", "bastard", "crap", "dick",
  "hell", "stupid", "idiot", "moron", "ugly", "disgusting", "trash",
  "kill", "die", "hate", "racist", "sexist", "nigger", "fag",
];

function containsBannedWords(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some((word) => lower.includes(word));
}

function readReviews(): any[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "[]", "utf-8");
      return [];
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeReviews(reviews: any[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(reviews, null, 2), "utf-8");
}

// Public: Get all approved reviews (mobile)
router.get("/mobile/reviews", (_req, res) => {
  const reviews = readReviews();
  const approved = reviews.filter((r: any) => r.approved !== false);
  approved.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(approved);
});

// Public: Get all approved reviews (website)
router.get("/website/reviews", (_req, res) => {
  const reviews = readReviews();
  const approved = reviews.filter((r: any) => r.approved !== false);
  approved.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(approved);
});

// Shared: Submit a review handler
function handlePostReview(req: any, res: any) {
  const { rating, text, imageUrl } = req.body;
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  let userName = "Anonymous";
  let userId = "anonymous";
  if (token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
      userName = payload.name || payload.phone || "Anonymous";
      userId = payload.userId || payload.sub || "anonymous";
    } catch {}
  }

  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }
  if (!text || typeof text !== "string" || text.trim().length < 10) {
    return res.status(400).json({ error: "Review must be at least 10 characters" });
  }
  if (text.trim().length > 500) {
    return res.status(400).json({ error: "Review must be under 500 characters" });
  }
  if (containsBannedWords(text)) {
    return res.status(400).json({ error: "Review contains inappropriate language" });
  }

  if (imageUrl && typeof imageUrl === "string") {
    if (imageUrl.startsWith("data:")) {
      const mimeMatch = imageUrl.match(/^data:(image\/\w+);/);
      if (!mimeMatch) {
        return res.status(400).json({ error: "Invalid image format" });
      }
      const mime = mimeMatch[1];
      if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
        return res.status(400).json({ error: "Only JPG, PNG, and WebP images are allowed" });
      }
      const base64Data = imageUrl.split(",")[1] || "";
      const sizeBytes = (base64Data.length * 3) / 4;
      if (sizeBytes > 5 * 1024 * 1024) {
        return res.status(400).json({ error: "Image must be under 5MB" });
      }
    }
  }

  const review = {
    id: `rev_${Date.now()}`,
    userId,
    userName,
    rating: Math.round(rating),
    text: text.trim(),
    imageUrl: imageUrl || null,
    date: new Date().toISOString(),
    approved: true,
  };

  const reviews = readReviews();
  reviews.push(review);
  writeReviews(reviews);

  res.status(201).json(review);
}

// Submit a review (mobile + website share same handler)
router.post("/mobile/reviews", handlePostReview);
router.post("/website/reviews", handlePostReview);

// Admin: Get all reviews
router.get("/admin/reviews", (_req, res) => {
  const reviews = readReviews();
  reviews.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(reviews);
});

// Admin: Delete a review
router.delete("/admin/reviews/:id", adminAuth, (req, res) => {
  const { id } = req.params;
  const reviews = readReviews();
  const filtered = reviews.filter((r: any) => r.id !== id);
  if (filtered.length === reviews.length) {
    return res.status(404).json({ error: "Review not found" });
  }
  writeReviews(filtered);
  res.json({ ok: true });
});

// Admin: Toggle approval
router.patch("/admin/reviews/:id", adminAuth, (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;
  const reviews = readReviews();
  const review = reviews.find((r: any) => r.id === id);
  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }
  review.approved = approved;
  writeReviews(reviews);
  res.json(review);
});

export default router;
