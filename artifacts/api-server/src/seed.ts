import pool from "./db.js";

const CATEGORIES = [
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

const MENU_ITEMS = [
  { id: "m1", name: "Zinger Burger", description: "Crispy fried chicken fillet with spicy mayo and lettuce", price: 650, category: "Burgers", spicy: true, popular: true, calories: 520 },
  { id: "m2", name: "THB Mighty Box", description: "2 pieces chicken, fries, coleslaw and a drink", price: 1200, category: "Deals", spicy: false, popular: true, calories: 1100 },
  { id: "m3", name: "Crispy Strips (3pc)", description: "Tender chicken strips with your choice of dipping sauce", price: 490, category: "Chicken", spicy: false, popular: true, calories: 380 },
  { id: "m4", name: "Spicy Wings (6pc)", description: "Hot and crispy chicken wings with THB signature spice blend", price: 580, category: "Chicken", spicy: true, popular: false, calories: 460 },
  { id: "m5", name: "Chicken Wrap", description: "Grilled or crispy chicken in a soft tortilla with fresh veggies", price: 420, category: "Wraps", spicy: false, popular: false, calories: 340 },
  { id: "m6", name: "Spicy Wrap", description: "Crispy chicken, jalapeños, and hot sauce in a tortilla", price: 450, category: "Wraps", spicy: true, popular: false, calories: 360 },
  { id: "m7", name: "Loaded Fries", description: "Crispy fries topped with cheese sauce and jalapeños", price: 290, category: "Sides", spicy: false, popular: true, calories: 420, callout: "Check for real-time daily availability — Mutton dishes are prepared fresh each morning." },
  { id: "m8", name: "Coleslaw", description: "Creamy house-made coleslaw", price: 120, category: "Sides", spicy: false, popular: false, calories: 130 },
  { id: "m9", name: "Pepsi (Large)", description: "Chilled Pepsi 500ml", price: 150, category: "Beverages", spicy: false, popular: false, calories: 210 },
  { id: "m10", name: "Chocolate Lava Cake", description: "Warm chocolate cake with a gooey molten center", price: 280, category: "Desserts", spicy: false, popular: true, calories: 380 },
  { id: "m11", name: "Family Feast", description: "8pc chicken, 2 large fries, 4 drinks, coleslaw", price: 3200, category: "Deals", spicy: false, popular: true, calories: null },
  { id: "m12", name: "Quarter Pounder", description: "Juicy beef patty with THB special sauce", price: 720, category: "Burgers", spicy: false, popular: false, calories: 580 },
  { id: "m13", name: "Istanbul Pizza", description: "Wood-fired pizza with spiced chicken, peppers, and mozzarella", price: 850, category: "Pizza", spicy: false, popular: true, calories: 650 },
  { id: "m14", name: "Chicken Tikka Pizza", description: "Hand-tossed pizza with tikka chicken, onions, and cheddar blend", price: 900, category: "Pizza", spicy: true, popular: true, calories: 680 },
  { id: "m15", name: "Creamy Alfredo Pasta", description: "Fettuccine in rich Alfredo sauce with grilled chicken", price: 750, category: "Pasta", spicy: false, popular: true, calories: 520, callout: "Check for real-time daily availability — Mutton Handi is slow-cooked daily." },
  { id: "m16", name: "Mutton Handi", description: "Slow-cooked mutton in rich, aromatic gravy with traditional spices", price: 1200, category: "Handi", spicy: true, popular: true, calories: 580 },
  { id: "m17", name: "Chicken Handi", description: "Tender chicken cooked in creamy tomato-based handi gravy", price: 950, category: "Handi", spicy: false, popular: true, calories: 450 },
  { id: "m18", name: "Mutton Mandi", description: "Tender mutton cooked on charcoal with fragrant basmati rice and spices", price: 1500, category: "Mandi", spicy: false, popular: true, calories: 720 },
  { id: "m19", name: "Chicken Mandi", description: "Charcoal-grilled chicken with aromatic rice, raita, and traditional sides", price: 1100, category: "Mandi", spicy: false, popular: true, calories: 620 },
];

const BANNERS = [
  {
    id: "s1", title: "Big Deals, Bigger Savings", subtitle: "Save up to 40% on family meals",
    tag: " LIMITED TIME", tag_color: "#FFD54F", grad_start: "#C8102E", grad_end: "#8B0000",
    cta_label: "Order Now", cta_cat: "deals", image_url: "/images/hero-banner.png", active: true, sort_order: 0,
  },
  {
    id: "s2", title: "Istanbul Zinger Burger", subtitle: "Crispy, spicy, irresistible",
    tag: " BESTSELLER", tag_color: "#FF6B35", grad_start: "#FF6B35", grad_end: "#D32F2F",
    cta_label: "View Menu", cta_cat: "burgers", image_url: "/images/burger.png", active: true, sort_order: 1,
  },
  {
    id: "s3", title: "Crispy Chicken", subtitle: "Golden fried perfection",
    tag: " POPULAR", tag_color: "#4CAF50", grad_start: "#2E7D32", grad_end: "#1B5E20",
    cta_label: "Order Now", cta_cat: "chicken", image_url: "/images/chicken.png", active: true, sort_order: 2,
  },
];

const SETTINGS = {
  storeName: "The Hunger Bite Istanbul",
  storePhone: "03121129700",
  taxRate: 17,
  deliveryFee: 99,
  minOrderAmount: 500,
  freeDeliveryOver: 2000,
  takeawayDiscount: 10,
  preparationTime: 15,
  deliveryTime: 45,
  deliveryEnabled: true,
  takeawayEnabled: true,
  maxDeliveryRadius: 5,
};

const WEBSITE_CONTENT = [
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

export async function seedDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    const { rows: catRows } = await client.query("SELECT COUNT(*)::int as count FROM categories");
    if (catRows[0].count > 0) {
      console.log("Database already seeded, skipping");
      return;
    }

    await client.query("BEGIN");

    for (const c of CATEGORIES) {
      await client.query("INSERT INTO categories (id, name, slug, emoji) VALUES ($1,$2,$3,$4)", [c.id, c.name, c.slug, c.emoji]);
    }

    for (const m of MENU_ITEMS) {
      await client.query(
        `INSERT INTO menu_items (id, name, description, price, category, available, spicy, popular, calories, image_url, callout)
         VALUES ($1,$2,$3,$4,$5,true,$6,$7,$8,null,$9)`,
        [m.id, m.name, m.description, m.price, m.category, m.spicy, m.popular, m.calories, m.callout || null]
      );
    }

    for (const b of BANNERS) {
      await client.query(
        `INSERT INTO banners (id, title, subtitle, tag, tag_color, grad_start, grad_end, cta_label, cta_cat, image_url, active, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [b.id, b.title, b.subtitle, b.tag, b.tag_color, b.grad_start, b.grad_end, b.cta_label, b.cta_cat, b.image_url, b.active, b.sort_order]
      );
    }

    await client.query("INSERT INTO settings (key, value) VALUES ('store', $1)", [JSON.stringify(SETTINGS)]);

    for (const w of WEBSITE_CONTENT) {
      await client.query("INSERT INTO website_content (key, label, value, section) VALUES ($1,$2,$3,$4)", [w.key, w.label, w.value, w.section]);
    }

    const sampleOrders = [
      { id: "o1001", customer_name: "Ahmed Raza", customer_phone: "0300-1234567", order_type: "Dine In", items: [{ name: "THB Mighty Box", quantity: 2, price: 1200 }, { name: "Pepsi (Large)", quantity: 2, price: 150 }], total: 2700, status: "Preparing" },
      { id: "o1002", customer_name: "Sara Khan", customer_phone: "0321-9876543", order_type: "Delivery", items: [{ name: "Zinger Burger", quantity: 1, price: 650 }, { name: "Loaded Fries", quantity: 1, price: 290 }, { name: "Pepsi (Large)", quantity: 1, price: 150 }], total: 1090, status: "Received" },
      { id: "o1003", customer_name: "Bilal Akhtar", customer_phone: "0333-5550123", order_type: "Takeaway", items: [{ name: "Crispy Strips (3pc)", quantity: 2, price: 490 }, { name: "Coleslaw", quantity: 1, price: 120 }], total: 1100, status: "Ready" },
      { id: "o1004", customer_name: "Fatima Malik", customer_phone: "0312-7771234", order_type: "Delivery", items: [{ name: "Family Feast", quantity: 1, price: 3200 }], total: 3200, status: "Delivered" },
      { id: "o1005", customer_name: "Usman Tariq", customer_phone: "0345-2223344", order_type: "Dine In", items: [{ name: "Spicy Wings (6pc)", quantity: 1, price: 580 }, { name: "Loaded Fries", quantity: 2, price: 290 }, { name: "Pepsi (Large)", quantity: 2, price: 150 }], total: 1460, status: "Preparing" },
      { id: "o1006", customer_name: "Nadia Hussain", customer_phone: "0311-4445566", order_type: "Takeaway", items: [{ name: "Chicken Wrap", quantity: 2, price: 420 }, { name: "Spicy Wrap", quantity: 1, price: 450 }], total: 1290, status: "Delivered" },
    ];
    for (const o of sampleOrders) {
      await client.query(
        `INSERT INTO orders (id, customer_name, customer_phone, order_type, items, total, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW() - interval '${Math.floor(Math.random() * 120)} minutes')`,
        [o.id, o.customer_name, o.customer_phone, o.order_type, JSON.stringify(o.items), o.total, o.status]
      );
    }

    await client.query("COMMIT");
    console.log("Database seeded successfully");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
