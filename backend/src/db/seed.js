import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool, query } from "../config/db.js";
import { logger } from "../utils/logger.js";

async function run() {
  if (process.env.NODE_ENV === "production") throw new Error("Database seeding is disabled in production");
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 12) throw new Error("Set SEED_ADMIN_PASSWORD to at least 12 characters");
  const email = process.env.SEED_ADMIN_EMAIL || "admin@localhost";
  const hash = await bcrypt.hash(password, 10);

  // Seed admin user
  const adminRes = await query(
    `INSERT INTO users (name, email, phone, password_hash, role, email_verified)
     VALUES ($1,$2,$3,$4,'admin',true)
     ON CONFLICT (email) DO UPDATE SET password_hash=$4
     RETURNING id`,
    ["Admin", email, null, hash]
  );
  const adminId = adminRes.rows[0]?.id;
  logger.info(`✅ Admin user seeded/updated (${email})`);

  // Seed a farmer/seller user
  const farmerEmail = "farmer@localhost";
  const farmerHash = await bcrypt.hash("farmer123456", 10);
  const farmerRes = await query(
    `INSERT INTO users (name, email, phone, password_hash, role, email_verified)
     VALUES ($1,$2,$3,$4,'farmer',true)
     ON CONFLICT (email) DO UPDATE SET password_hash=$4
     RETURNING id`,
    ["Malik Farmer", farmerEmail, null, farmerHash]
  );
  const farmerId = farmerRes.rows[0]?.id;
  logger.info(`✅ Farmer user seeded/updated (${farmerEmail})`);

  // Clear existing listings to avoid duplicate entry errors or pollution
  await query("DELETE FROM listings");
  logger.info("🧹 Cleared old listings");

  // Sample listings across categories
  const listings = [
    {
      title: "Organic Wheat Grain (Kanak)",
      category: "crop",
      description: "Premium quality organic wheat grain, freshly harvested. Cleaned and packed in 50kg bags.",
      price_per_unit: 4200,
      unit: "40kg",
      quantity_available: 200,
    },
    {
      title: "Basmati Rice (Super Kernel)",
      category: "crop",
      description: "Premium long grain aromatic Basmati Rice. High yield crop from Punjab.",
      price_per_unit: 8500,
      unit: "40kg",
      quantity_available: 150,
    },
    {
      title: "Yellow Corn (Maize)",
      category: "crop",
      description: "High moisture control yellow maize grains suitable for animal feed or milling.",
      price_per_unit: 2800,
      unit: "40kg",
      quantity_available: 500,
    },
    {
      title: "Sugarcane Fresh Stalks",
      category: "crop",
      description: "Freshly cut high-sucrose sugarcane stalks directly from the field.",
      price_per_unit: 450,
      unit: "40kg",
      quantity_available: 1000,
    },
    {
      title: "High-Yield Bt Cotton Seeds",
      category: "seed",
      description: "Certified pest-resistant Bt cotton seeds for high-boll yield.",
      price_per_unit: 1200,
      unit: "kg",
      quantity_available: 500,
    },
    {
      title: "Premium Wheat Seeds (Faisalabad-2008)",
      category: "seed",
      description: "Rust-resistant high-germination wheat seeds certified by FSC&RD.",
      price_per_unit: 150,
      unit: "kg",
      quantity_available: 1000,
    },
    {
      title: "Urea Fertilizer 46%",
      category: "fertilizer",
      description: "Standard nitrogen fertilizer for crop growth enhancement.",
      price_per_unit: 4800,
      unit: "bag",
      quantity_available: 80,
    },
    {
      title: "NPK Compound Fertilizer (15-15-15)",
      category: "fertilizer",
      description: "Balanced nutrient complex fertilizer for early stages of crops.",
      price_per_unit: 7200,
      unit: "bag",
      quantity_available: 40,
    },
    {
      title: "Manual Seed Sower Machine",
      category: "equipment",
      description: "Hand-push roller seeder machine for corn, soybean, and wheat.",
      price_per_unit: 14500,
      unit: "unit",
      quantity_available: 10,
    },
    {
      title: "Drip Irrigation Emitter Pack",
      category: "equipment",
      description: "Pack of 500 pressure-compensating drip emitters for water conservation.",
      price_per_unit: 3500,
      unit: "pack",
      quantity_available: 25,
    }
  ];

  for (const item of listings) {
    await query(
      `INSERT INTO listings (seller_id, title, category, description, price_per_unit, unit, quantity_available, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
      [farmerId, item.title, item.category, item.description, item.price_per_unit, item.unit, item.quantity_available]
    );
  }
  logger.info(`✅ Seeded ${listings.length} marketplace listings`);

  await pool.end();
}
run().catch((e) => { console.error(e); process.exit(1); });
