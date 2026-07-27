import { Router, type IRouter, type Request, type Response } from "express";
import pool from "../db.js";

const router: IRouter = Router();

// ── Menu ────────────────────────────────────────────────────────────

router.get("/mobile/menu", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query("SELECT * FROM menu_items WHERE available = true ORDER BY id");
    res.json(rows);
  } catch {
    res.json([]);
  }
});

router.get("/mobile/categories", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query("SELECT * FROM categories ORDER BY name");
    res.json(rows);
  } catch {
    res.json([]);
  }
});

// ── Orders ──────────────────────────────────────────────────────────

router.post("/mobile/orders", async (req: Request, res: Response): Promise<void> => {
  const { customerName, customerPhone, orderType, items, subtotal, tax, deliveryFee, total, deliveryAddress, specialInstructions, paymentMethod } = req.body;
  if (!customerName || !customerPhone || !items?.length) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const orderId = `THB${Date.now().toString().slice(-6)}`;

  try {
    const { rows } = await pool.query(
      `INSERT INTO orders (id, customer_name, customer_phone, order_type, items, subtotal, tax, delivery_fee, total, status, delivery_address, special_instructions, payment_method)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Received',$10,$11,$12) RETURNING *`,
      [orderId, customerName, customerPhone, orderType || "takeaway", JSON.stringify(items.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.price }))),
       subtotal || 0, tax || 0, deliveryFee || 0, total || 0, deliveryAddress || null, specialInstructions || null, paymentMethod || "cod"]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create order" });
  }
});

router.get("/mobile/orders", async (req: Request, res: Response): Promise<void> => {
  const phone = req.query["phone"] as string;
  if (!phone) {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }
  try {
    const { rows } = await pool.query(
      "SELECT * FROM orders WHERE customer_phone = $1 ORDER BY created_at DESC",
      [phone]
    );
    res.json(rows);
  } catch {
    res.json([]);
  }
});

// ── Reservations ──────────────────────────────────────────────────

router.post("/mobile/reservations", async (req: Request, res: Response): Promise<void> => {
  const { customerName, customerPhone, date, time, partySize } = req.body;
  if (!customerName || !customerPhone || !date || !time) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO reservations (id, customer_name, customer_phone, date, time, party_size, status)
       VALUES ($1,$2,$3,$4,$5,$6,'confirmed') RETURNING *`,
      [`RES${Date.now().toString().slice(-6)}`, customerName, customerPhone, date, time, partySize || 2]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create reservation" });
  }
});

router.get("/mobile/reservations", async (req: Request, res: Response): Promise<void> => {
  const phone = req.query["phone"] as string;
  if (!phone) {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }
  try {
    const { rows } = await pool.query(
      "SELECT * FROM reservations WHERE customer_phone = $1 ORDER BY created_at DESC",
      [phone]
    );
    res.json(rows);
  } catch {
    res.json([]);
  }
});

export default router;
