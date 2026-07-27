import { Router } from "express";
import pool from "../db.js";
import { adminAuth } from "./admin.js";

const router = Router();

const BANNED_WORDS = [
  "fuck", "shit", "damn", "ass", "bitch", "bastard", "crap", "dick",
  "hell", "stupid", "idiot", "moron", "ugly", "disgusting", "trash",
  "kill", "die", "hate", "racist", "sexist", "nigger", "fag",
];

function containsBannedWords(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some((word) => lower.includes(word));
}

// Public: Get all approved reviews (mobile)
router.get("/mobile/reviews", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM reviews WHERE approved = true ORDER BY date DESC");
    res.json(rows);
  } catch {
    res.json([]);
  }
});

// Public: Get all approved reviews (website)
router.get("/website/reviews", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM reviews WHERE approved = true ORDER BY date DESC");
    res.json(rows);
  } catch {
    res.json([]);
  }
});

// Shared: Submit a review handler
function handlePostReview(req: any, res: any) {
  (async () => {
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

    try {
      const { rows } = await pool.query(
        `INSERT INTO reviews (id, user_id, user_name, rating, text, image_url, approved)
         VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING *`,
        [`rev_${Date.now()}`, userId, userName, Math.round(rating), text.trim(), imageUrl || null]
      );
      res.status(201).json(rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  })();
}

router.post("/mobile/reviews", handlePostReview);
router.post("/website/reviews", handlePostReview);

// Admin: Get all reviews
router.get("/admin/reviews", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM reviews ORDER BY date DESC");
    res.json(rows);
  } catch {
    res.json([]);
  }
});

// Admin: Delete a review
router.delete("/admin/reviews/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query("DELETE FROM reviews WHERE id = $1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Review not found" });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Toggle approval
router.patch("/admin/reviews/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE reviews SET approved = $1 WHERE id = $2 RETURNING *",
      [approved, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Review not found" });
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
