import { Router, type IRouter, type Request, type Response } from "express";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const router: IRouter = Router();

const DATA_DIR = join(process.cwd(), "data");

// ── Menu ────────────────────────────────────────────────────────────

router.get("/mobile/menu", async (_req: Request, res: Response): Promise<void> => {
  try {
    const store = JSON.parse(await readFile(join(DATA_DIR, "store.json"), "utf-8"));
    const items = (store.menuItems || []).filter((m: any) => m.available !== false);
    res.json(items);
  } catch {
    res.json([]);
  }
});

router.get("/mobile/categories", async (_req: Request, res: Response): Promise<void> => {
  try {
    const store = JSON.parse(await readFile(join(DATA_DIR, "store.json"), "utf-8"));
    res.json(store.categories || []);
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
  const storePath = join(DATA_DIR, "store.json");
  let store: any = { menuItems: [], orders: [], categories: [] };
  try {
    store = JSON.parse(await readFile(storePath, "utf-8"));
  } catch {}

  const orderId = `THB${Date.now().toString().slice(-6)}`;

  const order = {
    id: orderId,
    customerName,
    customerPhone,
    orderType: orderType || "takeaway",
    items: items.map((i: any) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
    })),
    subtotal: Number(subtotal) || 0,
    tax: Number(tax) || 0,
    deliveryFee: Number(deliveryFee) || 0,
    total: Number(total) || 0,
    status: "Received",
    createdAt: new Date().toISOString(),
    deliveryAddress: deliveryAddress || null,
    specialInstructions: specialInstructions || null,
    paymentMethod: paymentMethod || "cod",
  };

  store.orders = [order, ...(store.orders || [])];
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf-8");

  res.status(201).json(order);
});

router.get("/mobile/orders", async (req: Request, res: Response): Promise<void> => {
  const phone = req.query["phone"] as string;
  if (!phone) {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }
  try {
    const store = JSON.parse(await readFile(join(DATA_DIR, "store.json"), "utf-8"));
    const userOrders = (store.orders || [])
      .filter((o: any) => o.customerPhone === phone)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(userOrders);
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
  const storePath = join(DATA_DIR, "store.json");
  let store: any = { menuItems: [], orders: [], categories: [], reservations: [] };
  try {
    store = JSON.parse(await readFile(storePath, "utf-8"));
  } catch {}

  const reservation = {
    id: `RES${Date.now().toString().slice(-6)}`,
    customerName,
    customerPhone,
    date,
    time,
    partySize: Number(partySize) || 2,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  store.reservations = [reservation, ...(store.reservations || [])];
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf-8");

  res.status(201).json(reservation);
});

router.get("/mobile/reservations", async (req: Request, res: Response): Promise<void> => {
  const phone = req.query["phone"] as string;
  if (!phone) {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }
  try {
    const store = JSON.parse(await readFile(join(DATA_DIR, "store.json"), "utf-8"));
    const userReservations = (store.reservations || [])
      .filter((r: any) => r.customerPhone === phone)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(userReservations);
  } catch {
    res.json([]);
  }
});

export default router;
