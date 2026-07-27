import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "./auth.js";
import pool from "../db.js";
import {
  UpdateAdminMenuItemParams,
  UpdateAdminMenuItemBody,
  UpdateAdminMenuItemResponse,
  DeleteAdminMenuItemParams,
  UpdateAdminOrderStatusParams,
  UpdateAdminOrderStatusBody,
  UpdateAdminOrderStatusResponse,
  CreateAdminMenuItemBody,
  ListAdminMenuItemsResponseItem,
  ListAdminOrdersResponseItem,
  GetAdminAnalyticsResponse,
  CreateAdminCategoryBody,
  DeleteAdminCategoryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const ADMIN_USERNAME = "THB_ADMIN";
const ADMIN_PASSWORD = "TBH_PASSWORD_123";
const JWT_SECRET = process.env.JWT_SECRET || "thb-jwt-secret-2026-production-key-xK9mPz";

// ---------- Admin Auth ----------

router.post("/admin/auth", (req, res): void => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ sub: "admin", type: "access" }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ success: true, accessToken: token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// ---------- Admin Auth Middleware ----------

export function adminAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  const token = authHeader.substring(7);
  const result = verifyAccessToken(token);
  if (!result) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  next();
}

// ---------- Analytics ----------

router.get("/admin/analytics", async (req, res): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = "";
    const params: any[] = [];

    if (startDate) {
      params.push(startDate);
      dateFilter += ` AND created_at >= $${params.length}::timestamptz`;
    }
    if (endDate) {
      params.push(endDate + "T23:59:59");
      dateFilter += ` AND created_at <= $${params.length}::timestamptz`;
    }

    const { rows: orders } = await pool.query(`SELECT * FROM orders WHERE true ${dateFilter}`, params);
    const { rows: menuItems } = await pool.query("SELECT * FROM menu_items");

    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
    const totalOrders = orders.length;
    const activeOrders = orders.filter((o: any) => ["Received", "Preparing", "Ready"].includes(o.status)).length;
    const outOfStockItems = menuItems.filter((m: any) => !m.available).length;

    const categoryMap: Record<string, { orders: number; revenue: number }> = {};
    for (const order of orders) {
      const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
      for (const item of items) {
        const menuItem = menuItems.find((m: any) => m.name === item.name);
        const cat = menuItem?.category ?? "Other";
        if (!categoryMap[cat]) categoryMap[cat] = { orders: 0, revenue: 0 };
        categoryMap[cat].orders += item.quantity;
        categoryMap[cat].revenue += item.price * item.quantity;
      }
    }
    const categoryBreakdown = Object.entries(categoryMap).map(([category, stats]) => ({
      category, orders: stats.orders, revenue: stats.revenue,
    }));

    const dailyMap: Record<string, { revenue: number; orders: number }> = {};
    for (const order of orders) {
      const d = new Date(order.created_at);
      if (isNaN(d.getTime())) continue;
      const day = d.toISOString().split("T")[0];
      if (!dailyMap[day]) dailyMap[day] = { revenue: 0, orders: 0 };
      dailyMap[day].revenue += Number(order.total) || 0;
      dailyMap[day].orders += 1;
    }

    const sortedDays = Object.keys(dailyMap).sort();
    const rangeStart = sortedDays[0] || new Date().toISOString().split("T")[0];
    const rangeEnd = sortedDays[sortedDays.length - 1] || new Date().toISOString().split("T")[0];

    const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
    const current = new Date(rangeStart);
    const endD = new Date(rangeEnd);
    while (current <= endD) {
      const key = current.toISOString().split("T")[0];
      dailyRevenue.push({ date: key, revenue: dailyMap[key]?.revenue || 0, orders: dailyMap[key]?.orders || 0 });
      current.setDate(current.getDate() + 1);
    }
    if (dailyRevenue.length === 0) {
      const today = new Date().toISOString().split("T")[0];
      dailyRevenue.push({ date: today, revenue: 0, orders: 0 });
    }

    const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const order of orders) {
      const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
      for (const item of items) {
        if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        itemMap[item.name].quantity += item.quantity;
        itemMap[item.name].revenue += item.price * item.quantity;
      }
    }
    const topItems = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

    res.json(GetAdminAnalyticsResponse.parse({ totalRevenue, totalOrders, activeOrders, outOfStockItems, categoryBreakdown, dailyRevenue, topItems }));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Categories ----------

router.get("/admin/categories", async (_req, res): Promise<void> => {
  try {
    const { rows: cats } = await pool.query("SELECT * FROM categories ORDER BY name");
    const { rows: menuItems } = await pool.query("SELECT category FROM menu_items");
    const result = cats.map((c: any) => ({
      ...c,
      itemCount: menuItems.filter((m: any) => m.category.toLowerCase() === c.name.toLowerCase()).length,
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/admin/categories", adminAuth, async (req, res): Promise<void> => {
  const parsed = CreateAdminCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const { rows: existing } = await pool.query("SELECT id FROM categories WHERE slug = $1 OR LOWER(name) = LOWER($2)", [parsed.data.slug, parsed.data.name]);
    if (existing.length > 0) {
      res.status(409).json({ error: "A category with this name or slug already exists" });
      return;
    }
    const { rows } = await pool.query(
      "INSERT INTO categories (id, name, slug, emoji) VALUES ($1,$2,$3,$4) RETURNING *",
      [`cat-${Date.now()}`, parsed.data.name, parsed.data.slug, parsed.data.emoji || null]
    );
    res.status(201).json({ ...rows[0], itemCount: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/admin/categories/:id", adminAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const params = DeleteAdminCategoryParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const { rows: cat } = await pool.query("SELECT * FROM categories WHERE id = $1", [params.data.id]);
    if (cat.length === 0) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    const { rows: items } = await pool.query("SELECT COUNT(*)::int as count FROM menu_items WHERE LOWER(category) = LOWER($1)", [cat[0].name]);
    if (items[0].count > 0) {
      res.status(409).json({ error: `Cannot delete — ${items[0].count} menu item(s) use this category` });
      return;
    }
    await pool.query("DELETE FROM categories WHERE id = $1", [params.data.id]);
    res.sendStatus(204);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Menu ----------

router.get("/admin/menu", async (_req, res): Promise<void> => {
  try {
    const { rows } = await pool.query("SELECT * FROM menu_items ORDER BY id");
    res.json(rows.map((r: any) => ListAdminMenuItemsResponseItem.parse(r)));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/admin/menu", adminAuth, async (req, res): Promise<void> => {
  const parsed = CreateAdminMenuItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO menu_items (id, name, description, price, category, available, spicy, popular, calories, image_url, callout, offer_percentage, offer_label, offer_active, offer_start_date, offer_end_date)
       VALUES ($1,$2,$3,$4,$5,true,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [`m${Date.now()}`, parsed.data.name, parsed.data.description, parsed.data.price, parsed.data.category,
       parsed.data.spicy ?? false, parsed.data.popular ?? false, parsed.data.calories ?? null,
       parsed.data.imageUrl ?? null, parsed.data.callout ?? null,
       parsed.data.offerPercentage ?? null, parsed.data.offerLabel ?? null, parsed.data.offerActive ?? false,
       parsed.data.offerStartDate ?? null, parsed.data.offerEndDate ?? null]
    );
    res.status(201).json(ListAdminMenuItemsResponseItem.parse(rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/menu/:id", adminAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const params = UpdateAdminMenuItemParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAdminMenuItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(parsed.data)) {
      if (val === undefined) continue;
      const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      fields.push(`${dbKey} = $${idx}`);
      values.push(typeof val === "object" ? JSON.stringify(val) : val);
      idx++;
    }
    if (fields.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    values.push(params.data.id);
    const { rows } = await pool.query(`UPDATE menu_items SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`, values);
    if (rows.length === 0) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }
    res.json(UpdateAdminMenuItemResponse.parse(rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/admin/menu/:id", adminAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const params = DeleteAdminMenuItemParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const { rowCount } = await pool.query("DELETE FROM menu_items WHERE id = $1", [params.data.id]);
    if (rowCount === 0) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }
    res.sendStatus(204);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Orders ----------

router.get("/admin/orders", async (_req, res): Promise<void> => {
  try {
    const { rows } = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(rows.map((o: any) => ListAdminOrdersResponseItem.parse({ ...o, branch: o.branch ?? "Main" })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/orders/:id/status", adminAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const params = UpdateAdminOrderStatusParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAdminOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const { rows } = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [parsed.data.status, params.data.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(UpdateAdminOrderStatusResponse.parse({ ...rows[0], branch: rows[0].branch ?? "Main" }));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Staff Management ----------

router.get("/admin/staff", adminAuth, async (_req, res): Promise<void> => {
  try {
    const { rows } = await pool.query("SELECT * FROM staff ORDER BY created_at DESC");
    res.json(rows);
  } catch (err: any) {
    res.json([]);
  }
});

router.post("/admin/staff", adminAuth, async (req, res): Promise<void> => {
  const { username, name, password, role } = req.body;
  if (!username || !name || !password || !role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    const { rows } = await pool.query(
      "INSERT INTO staff (id, username, name, role, active) VALUES ($1,$2,$3,$4,true) RETURNING *",
      [`STF${Date.now().toString().slice(-6)}`, username, name, role]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/staff/:id", adminAuth, async (req, res): Promise<void> => {
  const id = req.params["id"];
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(req.body)) {
      fields.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    if (fields.length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
    values.push(id);
    const { rows } = await pool.query(`UPDATE staff SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`, values);
    if (rows.length === 0) { res.status(404).json({ error: "Staff not found" }); return; }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/admin/staff/:id", adminAuth, async (req, res): Promise<void> => {
  const id = req.params["id"];
  try {
    await pool.query("DELETE FROM staff WHERE id = $1", [id]);
    res.sendStatus(204);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Inventory ----------

router.patch("/admin/menu/:id/stock", adminAuth, async (req, res): Promise<void> => {
  const id = req.params["id"];
  const { stock } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE menu_items SET stock = $1 WHERE id = $2 RETURNING *",
      [Number(stock), id]
    );
    if (rows.length === 0) { res.status(404).json({ error: "Item not found" }); return; }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
