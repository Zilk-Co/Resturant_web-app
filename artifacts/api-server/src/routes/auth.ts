import { Router, type IRouter, type Request, type Response } from "express";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID, randomInt, createHash } from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";

const router: IRouter = Router();

const DATA_DIR = join(process.cwd(), "data");
const USERS_FILE = join(DATA_DIR, "users.json");
const OTP_FILE = join(DATA_DIR, "otp_store.json");
const TOKEN_BLACKLIST_FILE = join(DATA_DIR, "token_blacklist.json");
const REFRESH_TOKENS_FILE = join(DATA_DIR, "refresh_tokens.json");

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set. Server cannot start without it.");
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("FATAL: JWT_REFRESH_SECRET environment variable is not set. Server cannot start without it.");
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 3;

const BCRYPT_ROUNDS = 10;

type SavedAddress = {
  id: string;
  label: "Home" | "Work" | "Other";
  address: string;
  isDefault: boolean;
};

type UserRecord = {
  id: string;
  name: string;
  phone: string;
  username?: string;
  passwordHash?: string;
  email?: string;
  profilePicUrl?: string;
  addresses: SavedAddress[];
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
};

type OtpEntry = {
  phone: string;
  code: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  requestCount: number;
  lastRequestAt: number;
  signupData?: {
    username: string;
    passwordHash: string;
    name?: string;
  };
};

type RefreshTokenRecord = {
  token: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
  userAgent?: string;
  ipAddress?: string;
};

type TokenBlacklistEntry = {
  token: string;
  expiresAt: number;
};

// ── File I/O helpers ────────────────────────────────────────────────

async function loadJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function loadJsonSync<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(require("fs").readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

async function saveJson(file: string, data: unknown): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

// ── OTP helpers ─────────────────────────────────────────────────────

function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

async function sendOTP(phone: string, otp: string): Promise<void> {
  // Always log so OTP is visible during development
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║  THB AUTH: OTP for ${phone}`);
  console.log(`║  Code: ${otp}`);
  console.log(`║  Expires in 5 minutes`);
  console.log(`╚══════════════════════════════════════╝\n`);

  // Convert normalized phone (03XXXXXXXXX) to WhatsApp international format (92XXXXXXXXX)
  const whatsappPhone = phone.startsWith("0") ? `92${phone.slice(1)}` : phone;

  // Send via WhatsApp Cloud API when env vars are set
  if (process.env.WHATSAPP_API_KEY && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: whatsappPhone,
            type: "text",
            text: { body: `Your THB verification code is: ${otp}. It expires in 5 minutes.` },
          }),
        }
      );
      if (!response.ok) {
        const errBody = await response.text();
        console.error(`[OTP] WhatsApp API error ${response.status}: ${errBody}`);
      } else {
        console.log(`[OTP] WhatsApp message sent to ${whatsappPhone}`);
      }
    } catch (err) {
      console.error("[OTP] WhatsApp send failed:", err);
    }
  } else {
    console.log("[OTP] WhatsApp env vars not set — code printed above only");
  }
}

async function saveOtpEntry(entry: OtpEntry): Promise<void> {
  const store = await loadJson<Record<string, OtpEntry>>(OTP_FILE, {});
  store[entry.phone] = entry;
  await saveJson(OTP_FILE, store);
}

async function getOtpEntry(phone: string): Promise<OtpEntry | null> {
  const store = await loadJson<Record<string, OtpEntry>>(OTP_FILE, {});
  return store[phone] ?? null;
}

async function deleteOtpEntry(phone: string): Promise<void> {
  const store = await loadJson<Record<string, OtpEntry>>(OTP_FILE, {});
  delete store[phone];
  await saveJson(OTP_FILE, store);
}

// ── User helpers ────────────────────────────────────────────────────

type UsersData = { users: UserRecord[] };

async function loadUsers(): Promise<UsersData> {
  return loadJson<UsersData>(USERS_FILE, { users: [] });
}

function loadUsersSync(): UsersData {
  return loadJsonSync<UsersData>(USERS_FILE, { users: [] });
}

async function saveUsers(data: UsersData): Promise<void> {
  await saveJson(USERS_FILE, data);
}

// ── Refresh token helpers ───────────────────────────────────────────

type RefreshStore = { tokens: RefreshTokenRecord[] };

async function loadRefreshTokens(): Promise<RefreshStore> {
  return loadJson<RefreshStore>(REFRESH_TOKENS_FILE, { tokens: [] });
}

async function saveRefreshTokens(data: RefreshStore): Promise<void> {
  await saveJson(REFRESH_TOKENS_FILE, data);
}

// ── Token blacklist helpers ─────────────────────────────────────────

type BlacklistStore = { entries: TokenBlacklistEntry[] };

async function loadBlacklist(): Promise<BlacklistStore> {
  return loadJson<BlacklistStore>(TOKEN_BLACKLIST_FILE, { entries: [] });
}

async function saveBlacklist(data: BlacklistStore): Promise<void> {
  await saveJson(TOKEN_BLACKLIST_FILE, data);
}

async function isTokenBlacklisted(token: string): Promise<boolean> {
  const store = await loadBlacklist();
  const now = Date.now();
  store.entries = store.entries.filter((e) => e.expiresAt > now);
  if (store.entries.length > 0) await saveBlacklist(store);
  return store.entries.some((e) => e.token === token);
}

async function blacklistToken(token: string, expiresAt: number): Promise<void> {
  const store = await loadBlacklist();
  store.entries.push({ token, expiresAt });
  await saveBlacklist(store);
}

// ── JWT helpers ─────────────────────────────────────────────────────

function generateAccessToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "access" }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "refresh" }, JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` });
}

export function verifyAccessToken(token: string): { sub: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string") return null;
    if (decoded.type !== "access") return null;
    return { sub: decoded.sub as string };
  } catch {
    return null;
  }
}

function verifyRefreshToken(token: string): { sub: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    if (typeof decoded === "string") return null;
    if (decoded.type !== "refresh") return null;
    return { sub: decoded.sub as string };
  } catch {
    return null;
  }
}

// ── Auth middleware ──────────────────────────────────────────────────

export async function getUserFromRequest(req: Request): Promise<{ user: UserRecord; idx: number } | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);

  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) return null;

  const payload = verifyAccessToken(token);
  if (!payload) return null;

  const users = loadUsersSync();
  const idx = users.users.findIndex((u) => u.id === payload.sub);
  if (idx === -1) return null;
  return { user: users.users[idx], idx };
}

// ── Rate limiters ───────────────────────────────────────────────────

const otpRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many OTP requests. Try again in 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many verification attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts. Try again in 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ──────────────────────────────────────────────────────────

// POST /auth/request-otp
router.post("/auth/request-otp", otpRequestLimiter, async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body;
  if (!phone || typeof phone !== "string" || phone.trim().length < 10) {
    res.status(400).json({ error: "Valid phone number is required" });
    return;
  }

  const normalizedPhone = phone.trim().replace(/^\+?92/, "0").replace(/\s/g, "");

  const now = Date.now();
  const existing = await getOtpEntry(normalizedPhone);

  if (existing && now - existing.lastRequestAt < 60 * 1000) {
    res.status(429).json({ error: "Please wait 60 seconds before requesting a new OTP" });
    return;
  }

  if (existing && existing.requestCount >= 5) {
    res.status(429).json({ error: "Maximum OTP requests reached. Try again later." });
    return;
  }

  const code = generateOtp();
  const codeHash = hashOtp(code);

  const entry: OtpEntry = {
    phone: normalizedPhone,
    code,
    codeHash,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    requestCount: (existing?.requestCount ?? 0) + 1,
    lastRequestAt: now,
  };

  await saveOtpEntry(entry);

  await sendOTP(normalizedPhone, code);

  const response: any = {
    success: true,
    message: "OTP sent successfully",
    expiresIn: 300,
    phone: normalizedPhone,
  };

  if (process.env.SHOW_DEV_OTP === "true") {
    response.devOtp = code;
  }
  console.log(`[OTP] Phone: ${normalizedPhone}, Code: ${code}`);

  res.json(response);
});

// POST /auth/verify-otp
router.post("/auth/verify-otp", otpVerifyLimiter, loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const { phone, code, name } = req.body;
  if (!phone || !code) {
    res.status(400).json({ error: "Phone and OTP code are required" });
    return;
  }

  const normalizedPhone = phone.trim().replace(/^\+?92/, "0").replace(/\s/g, "");
  const now = Date.now();

  const entry = await getOtpEntry(normalizedPhone);
  if (!entry) {
    res.status(400).json({ error: "No OTP requested for this phone number" });
    return;
  }

  if (now > entry.expiresAt) {
    await deleteOtpEntry(normalizedPhone);
    res.status(400).json({ error: "OTP has expired. Please request a new one." });
    return;
  }

  if (entry.attempts >= MAX_OTP_ATTEMPTS) {
    await deleteOtpEntry(normalizedPhone);
    res.status(400).json({ error: "Too many failed attempts. Please request a new OTP." });
    return;
  }

  entry.attempts++;
  await saveOtpEntry(entry);

  const codeHash = hashOtp(code.trim());
  if (codeHash !== entry.codeHash) {
    res.status(400).json({
      error: "Invalid OTP code",
      attemptsRemaining: MAX_OTP_ATTEMPTS - entry.attempts,
    });
    return;
  }

  await deleteOtpEntry(normalizedPhone);

  const data = await loadUsers();
  let user = data.users.find((u) => u.phone === normalizedPhone);

  if (user) {
    if (name && typeof name === "string" && name.trim().length >= 2) {
      user.name = name.trim();
    }
    user.updatedAt = new Date().toISOString();
  } else {
    user = {
      id: `u${Date.now()}`,
      name: (name && name.trim().length >= 2) ? name.trim() : `User ${normalizedPhone.slice(-4)}`,
      phone: normalizedPhone,
      addresses: [],
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.users.push(user);
  }

  await saveUsers(data);

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const refreshRecord: RefreshTokenRecord = {
    token: refreshToken,
    userId: user.id,
    expiresAt: now + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    createdAt: now,
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  };

  const refreshStore = await loadRefreshTokens();
  refreshStore.tokens = refreshStore.tokens.filter((t) => t.userId !== user!.id);
  refreshStore.tokens.push(refreshRecord);
  await saveRefreshTokens(refreshStore);

  res.cookie("thb_refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });

  res.json({
    success: true,
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      username: user.username,
      email: user.email,
      profilePicUrl: user.profilePicUrl,
      addresses: user.addresses,
      loyaltyPoints: user.loyaltyPoints,
    },
  });
});

// POST /auth/signup — Step 1: request OTP for new account with username+password
router.post("/auth/signup", otpRequestLimiter, async (req: Request, res: Response): Promise<void> => {
  const { phone, username, password, name } = req.body;
  if (!phone || typeof phone !== "string" || phone.trim().length < 10) {
    res.status(400).json({ error: "Valid phone number is required" });
    return;
  }
  if (!username || typeof username !== "string" || username.trim().length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters" });
    return;
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    res.status(400).json({ error: "Username can only contain letters, numbers, and underscores" });
    return;
  }

  const normalizedPhone = phone.trim().replace(/^\+?92/, "0").replace(/\s/g, "");
  const normalizedUsername = username.trim().toLowerCase();

  const data = await loadUsers();

  if (data.users.some((u) => u.username?.toLowerCase() === normalizedUsername)) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const now = Date.now();
  const existing = await getOtpEntry(normalizedPhone);

  if (existing && now - existing.lastRequestAt < 60 * 1000) {
    res.status(429).json({ error: "Please wait 60 seconds before requesting a new OTP" });
    return;
  }

  if (existing && existing.requestCount >= 5) {
    res.status(429).json({ error: "Maximum OTP requests reached. Try again later." });
    return;
  }

  const code = generateOtp();
  const codeHash = hashOtp(code);
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const entry: OtpEntry = {
    phone: normalizedPhone,
    code,
    codeHash,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    requestCount: (existing?.requestCount ?? 0) + 1,
    lastRequestAt: now,
    signupData: {
      username: normalizedUsername,
      passwordHash,
      name: name?.trim() || undefined,
    },
  };

  await saveOtpEntry(entry);
  await sendOTP(normalizedPhone, code);

  const response: any = {
    success: true,
    message: "OTP sent successfully",
    expiresIn: 300,
    phone: normalizedPhone,
  };

  if (process.env.SHOW_DEV_OTP === "true") {
    response.devOtp = code;
  }
  console.log(`[OTP] Phone: ${normalizedPhone}, Code: ${code}`);

  res.json(response);
});

// POST /auth/verify-signup — Step 2: verify OTP and create account
router.post("/auth/verify-signup", otpVerifyLimiter, loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    res.status(400).json({ error: "Phone and OTP code are required" });
    return;
  }

  const normalizedPhone = phone.trim().replace(/^\+?92/, "0").replace(/\s/g, "");
  const now = Date.now();

  const entry = await getOtpEntry(normalizedPhone);
  if (!entry) {
    res.status(400).json({ error: "No OTP requested for this phone number" });
    return;
  }

  if (now > entry.expiresAt) {
    await deleteOtpEntry(normalizedPhone);
    res.status(400).json({ error: "OTP has expired. Please request a new one." });
    return;
  }

  if (entry.attempts >= MAX_OTP_ATTEMPTS) {
    await deleteOtpEntry(normalizedPhone);
    res.status(400).json({ error: "Too many failed attempts. Please request a new OTP." });
    return;
  }

  entry.attempts++;
  await saveOtpEntry(entry);

  const codeHash = hashOtp(code.trim());
  if (codeHash !== entry.codeHash) {
    res.status(400).json({
      error: "Invalid OTP code",
      attemptsRemaining: MAX_OTP_ATTEMPTS - entry.attempts,
    });
    return;
  }

  if (!entry.signupData) {
    await deleteOtpEntry(normalizedPhone);
    res.status(400).json({ error: "Invalid signup session. Please start over." });
    return;
  }

  await deleteOtpEntry(normalizedPhone);

  const data = await loadUsers();

  if (data.users.some((u) => u.username?.toLowerCase() === entry.signupData!.username)) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const user: UserRecord = {
    id: `u${Date.now()}`,
    name: entry.signupData.name || `User ${normalizedPhone.slice(-4)}`,
    phone: normalizedPhone,
    username: entry.signupData.username,
    passwordHash: entry.signupData.passwordHash,
    addresses: [],
    loyaltyPoints: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.users.push(user);
  await saveUsers(data);

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const refreshRecord: RefreshTokenRecord = {
    token: refreshToken,
    userId: user.id,
    expiresAt: now + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    createdAt: now,
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  };

  const refreshStore = await loadRefreshTokens();
  refreshStore.tokens = refreshStore.tokens.filter((t) => t.userId !== user.id);
  refreshStore.tokens.push(refreshRecord);
  await saveRefreshTokens(refreshStore);

  res.cookie("thb_refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });

  res.json({
    success: true,
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      username: user.username,
      email: user.email,
      profilePicUrl: user.profilePicUrl,
      addresses: user.addresses,
      loyaltyPoints: user.loyaltyPoints,
    },
  });
});

// POST /auth/login — username + password
router.post("/auth/login", loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const data = await loadUsers();
  const user = data.users.find((u) => u.username?.toLowerCase() === username.trim().toLowerCase());

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const now = Date.now();
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const refreshRecord: RefreshTokenRecord = {
    token: refreshToken,
    userId: user.id,
    expiresAt: now + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    createdAt: now,
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  };

  const refreshStore = await loadRefreshTokens();
  refreshStore.tokens = refreshStore.tokens.filter((t) => t.userId !== user.id);
  refreshStore.tokens.push(refreshRecord);
  await saveRefreshTokens(refreshStore);

  user.updatedAt = new Date().toISOString();
  await saveUsers(data);

  res.cookie("thb_refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });

  res.json({
    success: true,
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      username: user.username,
      email: user.email,
      profilePicUrl: user.profilePicUrl,
      addresses: user.addresses,
      loyaltyPoints: user.loyaltyPoints,
    },
  });
});

// POST /auth/firebase-verify — verify Firebase ID token, create/login user
router.post("/auth/firebase-verify", otpVerifyLimiter, loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body;
  if (!idToken || typeof idToken !== "string") {
    res.status(400).json({ error: "Firebase ID token is required" });
    return;
  }

  let firebaseUser: { phone_number?: string; name?: string; exp?: number };
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT");
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));

    if (payload.exp && payload.exp < Date.now() / 1000) {
      res.status(401).json({ error: "Token expired" });
      return;
    }

    firebaseUser = payload;
  } catch {
    res.status(401).json({ error: "Failed to decode Firebase token" });
    return;
  }

  const phone = firebaseUser.phone_number;
  if (!phone) {
    res.status(400).json({ error: "No phone number in Firebase token" });
    return;
  }

  const normalizedPhone = phone.replace(/^\+?92/, "0").replace(/\s/g, "");
  const now = Date.now();
  const data = await loadUsers();
  let user = data.users.find((u) => u.phone === normalizedPhone);

  if (user) {
    user.updatedAt = new Date().toISOString();
  } else {
    user = {
      id: `u${Date.now()}`,
      name: firebaseUser.name || `User ${normalizedPhone.slice(-4)}`,
      phone: normalizedPhone,
      addresses: [],
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.users.push(user);
  }

  await saveUsers(data);

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const refreshRecord: RefreshTokenRecord = {
    token: refreshToken,
    userId: user.id,
    expiresAt: now + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    createdAt: now,
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  };

  const refreshStore = await loadRefreshTokens();
  refreshStore.tokens = refreshStore.tokens.filter((t) => t.userId !== user.id);
  refreshStore.tokens.push(refreshRecord);
  await saveRefreshTokens(refreshStore);

  res.cookie("thb_refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });

  res.json({
    success: true,
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      username: user.username,
      email: user.email,
      profilePicUrl: user.profilePicUrl,
      addresses: user.addresses,
      loyaltyPoints: user.loyaltyPoints,
    },
  });
});

// POST /auth/refresh
router.post("/auth/refresh", async (req: Request, res: Response): Promise<void> => {
  let refreshToken = req.cookies?.thb_refresh;

  if (!refreshToken && req.body?.refreshToken) {
    refreshToken = req.body.refreshToken;
  }

  if (!refreshToken) {
    res.status(401).json({ error: "Refresh token required" });
    return;
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  const refreshStore = await loadRefreshTokens();
  const idx = refreshStore.tokens.findIndex((t) => t.token === refreshToken);
  if (idx === -1) {
    res.status(401).json({ error: "Refresh token not found or revoked" });
    return;
  }

  const now = Date.now();
  const oldRecord = refreshStore.tokens[idx];
  if (now > oldRecord.expiresAt) {
    refreshStore.tokens.splice(idx, 1);
    await saveRefreshTokens(refreshStore);
    res.status(401).json({ error: "Refresh token expired" });
    return;
  }

  refreshStore.tokens.splice(idx, 1);

  const newAccessToken = generateAccessToken(payload.sub);
  const newRefreshToken = generateRefreshToken(payload.sub);

  const newRecord: RefreshTokenRecord = {
    token: newRefreshToken,
    userId: payload.sub,
    expiresAt: now + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    createdAt: now,
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  };
  refreshStore.tokens.push(newRecord);
  await saveRefreshTokens(refreshStore);

  res.cookie("thb_refresh", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });

  res.json({ accessToken: newAccessToken });
});

// POST /auth/logout
router.post("/auth/logout", async (req: Request, res: Response): Promise<void> => {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const decoded = jwt.decode(token);
      if (decoded && typeof decoded !== "string" && decoded.exp) {
        await blacklistToken(token, decoded.exp * 1000);
      }
    } catch {}
  }

  const refreshToken = req.cookies?.thb_refresh;
  if (refreshToken) {
    const refreshStore = await loadRefreshTokens();
    refreshStore.tokens = refreshStore.tokens.filter((t) => t.token !== refreshToken);
    await saveRefreshTokens(refreshStore);
  }

  res.clearCookie("thb_refresh", { path: "/api/auth" });
  res.json({ success: true, message: "Logged out successfully" });
});

// GET /auth/me
router.get("/auth/me", async (req: Request, res: Response): Promise<void> => {
  const session = await getUserFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({
    id: session.user.id,
    name: session.user.name,
    phone: session.user.phone,
    username: session.user.username,
    email: session.user.email,
    profilePicUrl: session.user.profilePicUrl,
    addresses: session.user.addresses,
    loyaltyPoints: session.user.loyaltyPoints,
  });
});

// PUT /auth/profile
router.put("/auth/profile", async (req: Request, res: Response): Promise<void> => {
  const session = await getUserFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const data = await loadUsers();
  const user = data.users[session.idx];
  if (req.body.name) user.name = req.body.name;
  if (req.body.email !== undefined) user.email = req.body.email;
  if (req.body.profilePicUrl !== undefined) user.profilePicUrl = req.body.profilePicUrl;
  user.updatedAt = new Date().toISOString();
  await saveUsers(data);
  res.json({
    id: user.id,
    name: user.name,
    phone: user.phone,
    username: user.username,
    email: user.email,
    profilePicUrl: user.profilePicUrl,
    addresses: user.addresses,
    loyaltyPoints: user.loyaltyPoints,
  });
});

// ── Address routes ──────────────────────────────────────────────────

router.get("/auth/addresses", async (req: Request, res: Response): Promise<void> => {
  const session = await getUserFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json(session.user.addresses);
});

router.post("/auth/addresses", async (req: Request, res: Response): Promise<void> => {
  const session = await getUserFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { label, address, isDefault } = req.body;
  if (!label || !address) {
    res.status(400).json({ error: "Label and address are required" });
    return;
  }
  const data = await loadUsers();
  const user = data.users[session.idx];
  const newAddr: SavedAddress = {
    id: randomUUID().slice(0, 8),
    label,
    address,
    isDefault: isDefault || false,
  };
  if (newAddr.isDefault) {
    user.addresses = user.addresses.map((a) => ({ ...a, isDefault: false }));
  }
  user.addresses.push(newAddr);
  user.updatedAt = new Date().toISOString();
  await saveUsers(data);
  res.status(201).json(newAddr);
});

router.put("/auth/addresses/:id", async (req: Request, res: Response): Promise<void> => {
  const session = await getUserFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const addrId = req.params["id"];
  const data = await loadUsers();
  const user = data.users[session.idx];
  const idx = user.addresses.findIndex((a) => a.id === addrId);
  if (idx === -1) {
    res.status(404).json({ error: "Address not found" });
    return;
  }
  const updates = req.body;
  if (updates.label) user.addresses[idx].label = updates.label;
  if (updates.address) user.addresses[idx].address = updates.address;
  if (updates.isDefault !== undefined) {
    if (updates.isDefault) {
      user.addresses = user.addresses.map((a) => ({ ...a, isDefault: false }));
    }
    user.addresses[idx].isDefault = updates.isDefault;
  }
  user.updatedAt = new Date().toISOString();
  await saveUsers(data);
  res.json(user.addresses[idx]);
});

router.delete("/auth/addresses/:id", async (req: Request, res: Response): Promise<void> => {
  const session = await getUserFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const addrId = req.params["id"];
  const data = await loadUsers();
  const user = data.users[session.idx];
  user.addresses = user.addresses.filter((a) => a.id !== addrId);
  user.updatedAt = new Date().toISOString();
  await saveUsers(data);
  res.sendStatus(204);
});

// ── Legacy compatibility: old /mobile/auth/* → new /auth/* ──────────

router.post("/mobile/auth/login", otpVerifyLimiter, loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const { phone, otp, name } = req.body;
  if (!phone || !otp) {
    res.status(400).json({ error: "Phone and OTP are required" });
    return;
  }

  const normalizedPhone = phone.trim().replace(/^\+?92/, "0").replace(/\s/g, "");
  const now = Date.now();

  const entry = await getOtpEntry(normalizedPhone);
  if (!entry) {
    res.status(400).json({ error: "No OTP requested for this phone number" });
    return;
  }

  if (now > entry.expiresAt) {
    await deleteOtpEntry(normalizedPhone);
    res.status(400).json({ error: "OTP has expired. Please request a new one." });
    return;
  }

  if (entry.attempts >= MAX_OTP_ATTEMPTS) {
    await deleteOtpEntry(normalizedPhone);
    res.status(400).json({ error: "Too many failed attempts. Please request a new OTP." });
    return;
  }

  entry.attempts++;
  await saveOtpEntry(entry);

  const codeHash = hashOtp(otp.trim());
  if (codeHash !== entry.codeHash) {
    res.status(400).json({
      error: "Invalid OTP code",
      attemptsRemaining: MAX_OTP_ATTEMPTS - entry.attempts,
    });
    return;
  }

  await deleteOtpEntry(normalizedPhone);

  const data = await loadUsers();
  let user = data.users.find((u) => u.phone === normalizedPhone);

  if (user) {
    if (name && typeof name === "string" && name.trim().length >= 2) {
      user.name = name.trim();
    }
    user.updatedAt = new Date().toISOString();
  } else {
    user = {
      id: `u${Date.now()}`,
      name: (name && name.trim().length >= 2) ? name.trim() : `User ${normalizedPhone.slice(-4)}`,
      phone: normalizedPhone,
      addresses: [],
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.users.push(user);
  }

  await saveUsers(data);

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const refreshStore = await loadRefreshTokens();
  refreshStore.tokens = refreshStore.tokens.filter((t) => t.userId !== user!.id);
  refreshStore.tokens.push({
    token: refreshToken,
    userId: user.id,
    expiresAt: now + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    createdAt: now,
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  });
  await saveRefreshTokens(refreshStore);

  res.cookie("thb_refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });

  res.json({
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    profilePicUrl: user.profilePicUrl,
    addresses: user.addresses,
    loyaltyPoints: user.loyaltyPoints,
    token: accessToken,
  });
});

router.get("/mobile/auth/me", async (req: Request, res: Response): Promise<void> => {
  const session = await getUserFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({
    id: session.user.id,
    name: session.user.name,
    phone: session.user.phone,
    email: session.user.email,
    profilePicUrl: session.user.profilePicUrl,
    addresses: session.user.addresses,
    loyaltyPoints: session.user.loyaltyPoints,
  });
});

router.put("/mobile/auth/profile", async (req: Request, res: Response): Promise<void> => {
  const session = await getUserFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const data = await loadUsers();
  const user = data.users[session.idx];
  if (req.body.name) user.name = req.body.name;
  if (req.body.email !== undefined) user.email = req.body.email;
  if (req.body.profilePicUrl !== undefined) user.profilePicUrl = req.body.profilePicUrl;
  user.updatedAt = new Date().toISOString();
  await saveUsers(data);
  res.json({
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    profilePicUrl: user.profilePicUrl,
    addresses: user.addresses,
    loyaltyPoints: user.loyaltyPoints,
  });
});

router.get("/mobile/auth/addresses", async (req: Request, res: Response): Promise<void> => {
  const session = await getUserFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json(session.user.addresses);
});

router.post("/mobile/auth/addresses", async (req: Request, res: Response): Promise<void> => {
  const session = await getUserFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { label, address, isDefault } = req.body;
  if (!label || !address) {
    res.status(400).json({ error: "Label and address are required" });
    return;
  }
  const data = await loadUsers();
  const user = data.users[session.idx];
  const newAddr: SavedAddress = {
    id: randomUUID().slice(0, 8),
    label,
    address,
    isDefault: isDefault || false,
  };
  if (newAddr.isDefault) {
    user.addresses = user.addresses.map((a) => ({ ...a, isDefault: false }));
  }
  user.addresses.push(newAddr);
  user.updatedAt = new Date().toISOString();
  await saveUsers(data);
  res.status(201).json(newAddr);
});

router.put("/mobile/auth/addresses/:id", async (req: Request, res: Response): Promise<void> => {
  const session = await getUserFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const addrId = req.params["id"];
  const data = await loadUsers();
  const user = data.users[session.idx];
  const idx = user.addresses.findIndex((a) => a.id === addrId);
  if (idx === -1) {
    res.status(404).json({ error: "Address not found" });
    return;
  }
  const updates = req.body;
  if (updates.label) user.addresses[idx].label = updates.label;
  if (updates.address) user.addresses[idx].address = updates.address;
  if (updates.isDefault !== undefined) {
    if (updates.isDefault) {
      user.addresses = user.addresses.map((a) => ({ ...a, isDefault: false }));
    }
    user.addresses[idx].isDefault = updates.isDefault;
  }
  user.updatedAt = new Date().toISOString();
  await saveUsers(data);
  res.json(user.addresses[idx]);
});

router.delete("/mobile/auth/addresses/:id", async (req: Request, res: Response): Promise<void> => {
  const session = await getUserFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const addrId = req.params["id"];
  const data = await loadUsers();
  const user = data.users[session.idx];
  user.addresses = user.addresses.filter((a) => a.id !== addrId);
  user.updatedAt = new Date().toISOString();
  await saveUsers(data);
  res.sendStatus(204);
});

export default router;
