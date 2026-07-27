import { Router, type IRouter } from "express";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "./auth";
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
  GetMobileMenuResponseItem,
  CreateAdminCategoryBody,
  DeleteAdminCategoryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ---------- Types ----------

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  spicy: boolean;
  popular: boolean;
  calories: number | null;
  imageUrl: string | null;
  callout: string | null;
  hasSizes?: boolean;
  priceSmall?: number | null;
  priceMedium?: number | null;
  priceLarge?: number | null;
  offerPercentage?: number | null;
  offerLabel?: string | null;
  offerActive?: boolean;
  offerStartDate?: string | null;
  offerEndDate?: string | null;
};

type OrderItem = { name: string; quantity: number; price: number };

type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  orderType: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
};

type StoreData = {
  menuItems: MenuItem[];
  orders: Order[];
  categories: Category[];
};

// ---------- Defaults ----------

const DATA_DIR = join(process.cwd(), "data");
const DATA_FILE = join(DATA_DIR, "store.json");

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-deals", name: "Deals", slug: "deals", emoji: "🔥" },
  { id: "cat-chicken", name: "Chicken", slug: "chicken", emoji: "🍗" },
  { id: "cat-burgers", name: "Burgers", slug: "burgers", emoji: "🍔" },
  { id: "cat-wraps", name: "Wraps", slug: "wraps", emoji: "🌯" },
  { id: "cat-sides", name: "Sides", slug: "sides", emoji: "🍟" },
  { id: "cat-beverages", name: "Beverages", slug: "beverages", emoji: "🥤" },
  { id: "cat-desserts", name: "Desserts", slug: "desserts", emoji: "🍰" },
  { id: "cat-pizza", name: "Pizza", slug: "pizza", emoji: "🍕" },
  { id: "cat-pasta", name: "Pasta", slug: "pasta", emoji: "🍝" },
  { id: "cat-handi", name: "Handi", slug: "handi", emoji: "🍲" },
  { id: "cat-mandi", name: "Mandi", slug: "mandi", emoji: "🍛" },
];

const DEFAULT_MENU: MenuItem[] = [
  { id: "m1", name: "Zinger Burger", description: "Crispy fried chicken fillet with spicy mayo and lettuce", price: 650, category: "Burgers", available: true, spicy: true, popular: true, calories: 520, imageUrl: null, callout: null },
  { id: "m2", name: "THB Mighty Box", description: "2 pieces chicken, fries, coleslaw and a drink", price: 1200, category: "Deals", available: true, spicy: false, popular: true, calories: 1100, imageUrl: null, callout: null },
  { id: "m3", name: "Crispy Strips (3pc)", description: "Tender chicken strips with your choice of dipping sauce", price: 490, category: "Chicken", available: true, spicy: false, popular: true, calories: 380, imageUrl: null, callout: null },
  { id: "m4", name: "Spicy Wings (6pc)", description: "Hot and crispy chicken wings with THB signature spice blend", price: 580, category: "Chicken", available: true, spicy: true, popular: false, calories: 460, imageUrl: null, callout: null },
  { id: "m5", name: "Chicken Wrap", description: "Grilled or crispy chicken in a soft tortilla with fresh veggies", price: 420, category: "Wraps", available: true, spicy: false, popular: false, calories: 340, imageUrl: null, callout: null },
  { id: "m6", name: "Spicy Wrap", description: "Crispy chicken, jalapeños, and hot sauce in a tortilla", price: 450, category: "Wraps", available: true, spicy: true, popular: false, calories: 360, imageUrl: null, callout: null },
  { id: "m7", name: "Loaded Fries", description: "Crispy fries topped with cheese sauce and jalapeños", price: 290, category: "Sides", available: true, spicy: false, popular: true, calories: 420, imageUrl: null, callout: "Check for real-time daily availability — Mutton dishes are prepared fresh each morning." },
  { id: "m8", name: "Coleslaw", description: "Creamy house-made coleslaw", price: 120, category: "Sides", available: true, spicy: false, popular: false, calories: 130, imageUrl: null, callout: null },
  { id: "m9", name: "Pepsi (Large)", description: "Chilled Pepsi 500ml", price: 150, category: "Beverages", available: true, spicy: false, popular: false, calories: 210, imageUrl: null, callout: null },
  { id: "m10", name: "Chocolate Lava Cake", description: "Warm chocolate cake with a gooey molten center", price: 280, category: "Desserts", available: true, spicy: false, popular: true, calories: 380, imageUrl: null, callout: null },
  { id: "m11", name: "Family Feast", description: "8pc chicken, 2 large fries, 4 drinks, coleslaw", price: 3200, category: "Deals", available: true, spicy: false, popular: true, calories: null, imageUrl: null, callout: null },
  { id: "m12", name: "Quarter Pounder", description: "Juicy beef patty with THB special sauce", price: 720, category: "Burgers", available: true, spicy: false, popular: false, calories: 580, imageUrl: null, callout: null },
  { id: "m13", name: "Istanbul Pizza", description: "Wood-fired pizza with spiced chicken, peppers, and mozzarella", price: 850, category: "Pizza", available: true, spicy: false, popular: true, calories: 650, imageUrl: null, callout: null },
  { id: "m14", name: "Chicken Tikka Pizza", description: "Hand-tossed pizza with tikka chicken, onions, and cheddar blend", price: 900, category: "Pizza", available: true, spicy: true, popular: true, calories: 680, imageUrl: null, callout: null },
  { id: "m15", name: "Creamy Alfredo Pasta", description: "Fettuccine in rich Alfredo sauce with grilled chicken", price: 750, category: "Pasta", available: true, spicy: false, popular: true, calories: 520, imageUrl: null, callout: "Check for real-time daily availability — Mutton Handi is slow-cooked daily." },
  { id: "m16", name: "Mutton Handi", description: "Slow-cooked mutton in rich, aromatic gravy with traditional spices", price: 1200, category: "Handi", available: true, spicy: true, popular: true, calories: 580, imageUrl: null, callout: null },
  { id: "m17", name: "Chicken Handi", description: "Tender chicken cooked in creamy tomato-based handi gravy", price: 950, category: "Handi", available: true, spicy: false, popular: true, calories: 450, imageUrl: null, callout: null },
  { id: "m18", name: "Mutton Mandi", description: "Tender mutton cooked on charcoal with fragrant basmati rice and spices", price: 1500, category: "Mandi", available: true, spicy: false, popular: true, calories: 720, imageUrl: null, callout: null },
  { id: "m19", name: "Chicken Mandi", description: "Charcoal-grilled chicken with aromatic rice, raita, and traditional sides", price: 1100, category: "Mandi", available: true, spicy: false, popular: true, calories: 620, imageUrl: null, callout: null },
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: "o1001", customerName: "Ahmed Raza", customerPhone: "0300-1234567", orderType: "Dine In",
    items: [{ name: "THB Mighty Box", quantity: 2, price: 1200 }, { name: "Pepsi (Large)", quantity: 2, price: 150 }],
    total: 2700, status: "Preparing", createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "o1002", customerName: "Sara Khan", customerPhone: "0321-9876543", orderType: "Delivery",
    items: [{ name: "Zinger Burger", quantity: 1, price: 650 }, { name: "Loaded Fries", quantity: 1, price: 290 }, { name: "Pepsi (Large)", quantity: 1, price: 150 }],
    total: 1090, status: "Received", createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "o1003", customerName: "Bilal Akhtar", customerPhone: "0333-5550123", orderType: "Takeaway",
    items: [{ name: "Crispy Strips (3pc)", quantity: 2, price: 490 }, { name: "Coleslaw", quantity: 1, price: 120 }],
    total: 1100, status: "Ready", createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "o1004", customerName: "Fatima Malik", customerPhone: "0312-7771234", orderType: "Delivery",
    items: [{ name: "Family Feast", quantity: 1, price: 3200 }],
    total: 3200, status: "Delivered", createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
  },
  {
    id: "o1005", customerName: "Usman Tariq", customerPhone: "0345-2223344", orderType: "Dine In",
    items: [{ name: "Spicy Wings (6pc)", quantity: 1, price: 580 }, { name: "Loaded Fries", quantity: 2, price: 290 }, { name: "Pepsi (Large)", quantity: 2, price: 150 }],
    total: 1460, status: "Preparing", createdAt: new Date(Date.now() - 22 * 60000).toISOString(),
  },
  {
    id: "o1006", customerName: "Nadia Hussain", customerPhone: "0311-4445566", orderType: "Takeaway",
    items: [{ name: "Chicken Wrap", quantity: 2, price: 420 }, { name: "Spicy Wrap", quantity: 1, price: 450 }],
    total: 1290, status: "Delivered", createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
  },
];

// ---------- Persistence ----------

async function loadStore(): Promise<StoreData> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      menuItems: parsed.menuItems ?? DEFAULT_MENU,
      orders: parsed.orders ?? DEFAULT_ORDERS,
      categories: parsed.categories ?? DEFAULT_CATEGORIES,
    };
  } catch {
    return { menuItems: DEFAULT_MENU, orders: DEFAULT_ORDERS, categories: DEFAULT_CATEGORIES };
  }
}

async function saveStore(data: StoreData): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ---------- Analytics helper ----------

function buildAnalytics(store: StoreData, startDate?: string, endDate?: string) {
  const { menuItems, orders } = store;

  const filteredOrders = orders.filter((o) => {
    const orderDate = new Date(o.createdAt);
    if (startDate && orderDate < new Date(startDate)) return false;
    if (endDate && orderDate > new Date(endDate + "T23:59:59")) return false;
    return true;
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const activeOrders = filteredOrders.filter((o) => ["Received", "Preparing", "Ready"].includes(o.status)).length;
  const outOfStockItems = menuItems.filter((m) => !m.available).length;

  const categoryMap: Record<string, { orders: number; revenue: number }> = {};
  for (const order of filteredOrders) {
    for (const item of order.items) {
      const menuItem = menuItems.find((m) => m.name === item.name);
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
  for (const order of filteredOrders) {
    const d = new Date(order.createdAt);
    if (isNaN(d.getTime())) continue;
    const day = d.toISOString().split("T")[0];
    if (!dailyMap[day]) dailyMap[day] = { revenue: 0, orders: 0 };
    dailyMap[day].revenue += order.total || 0;
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

  // Top selling items
  const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const order of filteredOrders) {
    for (const item of order.items) {
      if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      itemMap[item.name].quantity += item.quantity;
      itemMap[item.name].revenue += item.price * item.quantity;
    }
  }
  const topItems = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

  return { totalRevenue, totalOrders, activeOrders, outOfStockItems, categoryBreakdown, dailyRevenue, topItems };
}

// ---------- Admin Auth ----------

const ADMIN_USERNAME = "THB_ADMIN";
const ADMIN_PASSWORD = "TBH_PASSWORD_123";
const JWT_SECRET = process.env.JWT_SECRET || "thb-jwt-secret-2026-production-key-xK9mPz";

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
  const { startDate, endDate } = req.query;
  const store = await loadStore();
  const analytics = buildAnalytics(store, startDate as string, endDate as string);
  res.json(GetAdminAnalyticsResponse.parse(analytics));
});

// ---------- Categories ----------

router.get("/admin/categories", async (_req, res): Promise<void> => {
  const store = await loadStore();
  const cats = store.categories ?? DEFAULT_CATEGORIES;
  const result = cats.map((c) => ({
    ...c,
    itemCount: store.menuItems.filter((m) => m.category.toLowerCase() === c.name.toLowerCase() || m.category === c.name).length,
  }));
  res.json(result);
});

router.post("/admin/categories", adminAuth, async (req, res): Promise<void> => {
  const parsed = CreateAdminCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const store = await loadStore();
  const cats = store.categories ?? DEFAULT_CATEGORIES;
  const exists = cats.some(
    (c) => c.slug === parsed.data.slug || c.name.toLowerCase() === parsed.data.name.toLowerCase()
  );
  if (exists) {
    res.status(409).json({ error: "A category with this name or slug already exists" });
    return;
  }
  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name: parsed.data.name,
    slug: parsed.data.slug,
    emoji: parsed.data.emoji ?? undefined,
  };
  store.categories = [...cats, newCat];
  await saveStore(store);
  res.status(201).json({ ...newCat, itemCount: 0 });
});

router.delete("/admin/categories/:id", adminAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const params = DeleteAdminCategoryParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const store = await loadStore();
  const cats = store.categories ?? DEFAULT_CATEGORIES;
  const cat = cats.find((c) => c.id === params.data.id);
  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  const itemCount = store.menuItems.filter((m) => m.category.toLowerCase() === cat.name.toLowerCase()).length;
  if (itemCount > 0) {
    res.status(409).json({ error: `Cannot delete — ${itemCount} menu item(s) use this category` });
    return;
  }
  store.categories = cats.filter((c) => c.id !== params.data.id);
  await saveStore(store);
  res.sendStatus(204);
});

// ---------- Menu ----------

router.get("/admin/menu", async (_req, res): Promise<void> => {
  const store = await loadStore();
  res.json(store.menuItems.map((m) => ListAdminMenuItemsResponseItem.parse(m)));
});

router.post("/admin/menu", adminAuth, async (req, res): Promise<void> => {
  const parsed = CreateAdminMenuItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const store = await loadStore();
  const newItem: MenuItem = {
    id: `m${Date.now()}`,
    name: parsed.data.name,
    description: parsed.data.description,
    price: parsed.data.price,
    category: parsed.data.category,
    available: true,
    spicy: parsed.data.spicy ?? false,
    popular: parsed.data.popular ?? false,
    calories: parsed.data.calories ?? null,
    imageUrl: parsed.data.imageUrl ?? null,
    callout: parsed.data.callout ?? null,
    offerPercentage: parsed.data.offerPercentage ?? null,
    offerLabel: parsed.data.offerLabel ?? null,
    offerActive: parsed.data.offerActive ?? false,
    offerStartDate: parsed.data.offerStartDate ?? null,
    offerEndDate: parsed.data.offerEndDate ?? null,
  };
  store.menuItems.push(newItem);
  await saveStore(store);
  res.status(201).json(ListAdminMenuItemsResponseItem.parse(newItem));
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
  const store = await loadStore();
  const idx = store.menuItems.findIndex((m) => m.id === params.data.id);
  if (idx === -1) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }
  store.menuItems[idx] = { ...store.menuItems[idx], ...parsed.data } as MenuItem;
  await saveStore(store);
  res.json(UpdateAdminMenuItemResponse.parse(store.menuItems[idx]));
});

router.delete("/admin/menu/:id", adminAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const params = DeleteAdminMenuItemParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const store = await loadStore();
  const idx = store.menuItems.findIndex((m) => m.id === params.data.id);
  if (idx === -1) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }
  store.menuItems.splice(idx, 1);
  await saveStore(store);
  res.sendStatus(204);
});

// ---------- Orders ----------

router.get("/admin/orders", async (_req, res): Promise<void> => {
  const store = await loadStore();
  const sorted = [...store.orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  res.json(sorted.map((o) => ListAdminOrdersResponseItem.parse({ ...o, branch: o.branch ?? "Main" })));
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
  const store = await loadStore();
  const idx = store.orders.findIndex((o) => o.id === params.data.id);
  if (idx === -1) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  store.orders[idx] = { ...store.orders[idx], status: parsed.data.status };
  await saveStore(store);
  res.json(UpdateAdminOrderStatusResponse.parse({ ...store.orders[idx], branch: store.orders[idx].branch ?? "Main" }));
});

// ---------- Staff Management ----------

router.get("/admin/staff", adminAuth, async (_req, res): Promise<void> => {
  const store = await loadStore();
  res.json(store.staff || []);
});

router.post("/admin/staff", adminAuth, async (req, res): Promise<void> => {
  const { username, name, password, role } = req.body;
  if (!username || !name || !password || !role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const store = await loadStore();
  if (!store.staff) store.staff = [];
  const member = {
    id: `STF${Date.now().toString().slice(-6)}`,
    username,
    name,
    role,
    active: true,
    createdAt: new Date().toISOString(),
  };
  store.staff.push(member);
  await saveStore(store);
  res.status(201).json(member);
});

router.patch("/admin/staff/:id", adminAuth, async (req, res): Promise<void> => {
  const id = req.params["id"];
  const store = await loadStore();
  const idx = (store.staff || []).findIndex((s: any) => s.id === id);
  if (idx === -1) { res.status(404).json({ error: "Staff not found" }); return; }
  store.staff[idx] = { ...store.staff[idx], ...req.body };
  await saveStore(store);
  res.json(store.staff[idx]);
});

router.delete("/admin/staff/:id", adminAuth, async (req, res): Promise<void> => {
  const id = req.params["id"];
  const store = await loadStore();
  store.staff = (store.staff || []).filter((s: any) => s.id !== id);
  await saveStore(store);
  res.sendStatus(204);
});

// ---------- Inventory ----------

router.patch("/admin/menu/:id/stock", adminAuth, async (req, res): Promise<void> => {
  const id = req.params["id"];
  const { stock } = req.body;
  const store = await loadStore();
  const idx = store.menuItems.findIndex((m) => m.id === id);
  if (idx === -1) { res.status(404).json({ error: "Item not found" }); return; }
  store.menuItems[idx] = { ...store.menuItems[idx], stock: Number(stock) };
  await saveStore(store);
  res.json(store.menuItems[idx]);
});

export default router;
