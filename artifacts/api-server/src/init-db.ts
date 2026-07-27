import pool from "./db.js";

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        emoji TEXT
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        price NUMERIC NOT NULL DEFAULT 0,
        category TEXT NOT NULL,
        available BOOLEAN NOT NULL DEFAULT true,
        spicy BOOLEAN NOT NULL DEFAULT false,
        popular BOOLEAN NOT NULL DEFAULT false,
        calories INTEGER,
        image_url TEXT,
        callout TEXT,
        has_sizes BOOLEAN DEFAULT false,
        price_small NUMERIC,
        price_medium NUMERIC,
        price_large NUMERIC,
        offer_percentage NUMERIC,
        offer_label TEXT,
        offer_active BOOLEAN DEFAULT false,
        offer_start_date TEXT,
        offer_end_date TEXT,
        stock INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        order_type TEXT NOT NULL DEFAULT 'takeaway',
        items JSONB NOT NULL DEFAULT '[]',
        subtotal NUMERIC DEFAULT 0,
        tax NUMERIC DEFAULT 0,
        delivery_fee NUMERIC DEFAULT 0,
        total NUMERIC DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Received',
        branch TEXT DEFAULT 'Main',
        delivery_address TEXT,
        special_instructions TEXT,
        payment_method TEXT DEFAULT 'cod',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS banners (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL DEFAULT '',
        tag TEXT NOT NULL DEFAULT '',
        tag_color TEXT NOT NULL DEFAULT '#FFD54F',
        grad_start TEXT NOT NULL DEFAULT '#C8102E',
        grad_end TEXT NOT NULL DEFAULT '#8B0000',
        cta_label TEXT NOT NULL DEFAULT 'Order Now',
        cta_cat TEXT NOT NULL DEFAULT 'deals',
        image_url TEXT NOT NULL DEFAULT '',
        active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'anonymous',
        user_name TEXT NOT NULL DEFAULT 'Anonymous',
        rating INTEGER NOT NULL,
        text TEXT NOT NULL,
        image_url TEXT,
        date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        approved BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS website_content (
        key TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        value TEXT NOT NULL DEFAULT '',
        section TEXT NOT NULL DEFAULT 'general'
      );

      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE,
        username TEXT UNIQUE,
        password_hash TEXT,
        email TEXT,
        profile_pic_url TEXT,
        loyalty_points INTEGER DEFAULT 0,
        addresses JSONB DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS token_blacklist (
        token TEXT PRIMARY KEY
      );

      CREATE TABLE IF NOT EXISTS otp_store (
        phone TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT,
        expires_at BIGINT NOT NULL,
        attempts INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        party_size INTEGER DEFAULT 2,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'confirmed',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Database tables initialized");
  } finally {
    client.release();
  }
}
