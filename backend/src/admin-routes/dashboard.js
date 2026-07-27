import { Router } from "express";
import { query } from "../config/db.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const r = Router();
r.use(requireAuth, requireAdmin);

r.get(
  "/",
  asyncHandler(async (req, res) => {
    // Collect stats from various tables
    const [
      usersCount,
      farmersCount,
      farmsCount,
      cropsCount,
      listingsCount,
      ordersCount,
      revenueQuery,
      premiumUsers,
      diseaseReports, // Assuming AI reports or alerts, we'll mock or query notifications
      recentUsers,
      recentOrders
    ] = await Promise.all([
      query("SELECT COUNT(*)::int c FROM users"),
      query("SELECT COUNT(*)::int c FROM users WHERE role = 'farmer'"),
      query("SELECT COUNT(*)::int c FROM farms"),
      query("SELECT COUNT(*)::int c FROM crops"),
      query("SELECT COUNT(*)::int c FROM listings"),
      query("SELECT COUNT(*)::int c FROM orders"),
      query("SELECT COALESCE(SUM(total_amount), 0)::numeric c FROM orders WHERE status = 'delivered'"),
      query("SELECT COUNT(*)::int c FROM user_subscriptions WHERE status = 'active'"),
      query("SELECT COUNT(*)::int c FROM notifications WHERE title ILIKE '%disease%'"), // Rough proxy for now
      query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5"),
      query(`
        SELECT o.id, o.status, o.total_amount, o.created_at, l.title AS listing_title
        FROM orders o
        JOIN listings l ON o.listing_id = l.id
        ORDER BY o.created_at DESC LIMIT 5
      `)
    ]);

    // Daily registrations chart data (last 7 days)
    const { rows: dailyRegs } = await query(`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);

    res.json({
      ok: true,
      data: {
        stats: {
          totalUsers: usersCount.rows[0].c,
          totalFarmers: farmersCount.rows[0].c,
          totalExperts: 0, // Placeholder
          totalBuyers: usersCount.rows[0].c - farmersCount.rows[0].c, // Proxy
          totalFarms: farmsCount.rows[0].c,
          totalCrops: cropsCount.rows[0].c,
          totalListings: listingsCount.rows[0].c,
          totalOrders: ordersCount.rows[0].c,
          totalRevenue: parseFloat(revenueQuery.rows[0].c),
          premiumUsers: premiumUsers.rows[0].c,
          diseaseReports: diseaseReports.rows[0].c,
          activeUsers: Math.floor(usersCount.rows[0].c * 0.8), // Mock active metric
        },
        recentUsers: recentUsers.rows,
        recentOrders: recentOrders.rows,
        charts: {
          dailyRegistrations: dailyRegs
        }
      }
    });
  })
);

export default r;
