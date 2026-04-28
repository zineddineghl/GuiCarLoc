const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard
router.get('/', authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user.id;

    const [carsResult, confirmedBookingsResult, allBookingsResult, ratingResult, monthlyRevenueResult, recentBookingsResult] = await Promise.all([
      pool.query(`
        SELECT c.id, c.title, c.brand, c.model, c.year, c.images, c.available, c.price_per_day,
               COALESCE((SELECT COUNT(*)::int FROM bookings WHERE car_id = c.id), 0) as booking_count,
               COALESCE((SELECT SUM(total_price) FROM bookings WHERE car_id = c.id AND status = 'confirmed'), 0) as revenue,
               COALESCE((SELECT COUNT(*)::int FROM reviews WHERE car_id = c.id), 0) as review_count,
               (SELECT ROUND(AVG(car_rating)::numeric, 1) FROM reviews WHERE car_id = c.id) as avg_rating
        FROM cars c
        WHERE c.owner_id = $1
        ORDER BY revenue DESC
      `, [ownerId]),
      pool.query(`
        SELECT b.car_id, b.start_date, b.end_date
        FROM bookings b
        JOIN cars c ON b.car_id = c.id
        WHERE c.owner_id = $1 AND b.status = 'confirmed'
      `, [ownerId]),
      pool.query(`
        SELECT b.status, b.total_price, b.start_date
        FROM bookings b
        JOIN cars c ON b.car_id = c.id
        WHERE c.owner_id = $1
      `, [ownerId]),
      pool.query(`
        SELECT ROUND(AVG(owner_rating)::numeric, 1) as avg_owner_rating, COUNT(*)::int as total_reviews
        FROM reviews WHERE owner_id = $1
      `, [ownerId]),
      pool.query(`
        SELECT TO_CHAR(b.start_date::date, 'YYYY-MM') as month,
               ROUND(SUM(b.total_price)::numeric, 0) as revenue,
               COUNT(*)::int as bookings
        FROM bookings b
        JOIN cars c ON b.car_id = c.id
        WHERE c.owner_id = $1 AND b.status = 'confirmed'
          AND b.start_date::date >= (NOW() - INTERVAL '6 months')::date
        GROUP BY TO_CHAR(b.start_date::date, 'YYYY-MM')
        ORDER BY month ASC
      `, [ownerId]),
      pool.query(`
        SELECT b.id, b.status, b.start_date, b.end_date, b.total_price, b.created_at,
               c.title as car_title, c.brand, c.model,
               u.name as renter_name
        FROM bookings b
        JOIN cars c ON b.car_id = c.id
        JOIN users u ON b.renter_id = u.id
        WHERE c.owner_id = $1
        ORDER BY b.created_at DESC
        LIMIT 8
      `, [ownerId])
    ]);

    const cars = carsResult.rows;
    const confirmedBookings = confirmedBookingsResult.rows;
    const allBookings = allBookingsResult.rows;

    // Occupancy per car (last 365 days)
    const now = new Date();
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const occupancyMap = {};
    for (const b of confirmedBookings) {
      const start = new Date(Math.max(new Date(b.start_date).getTime(), yearAgo.getTime()));
      const end = new Date(Math.min(new Date(b.end_date).getTime(), now.getTime()));
      if (end > start) {
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        occupancyMap[b.car_id] = (occupancyMap[b.car_id] || 0) + days;
      }
    }

    const carsWithStats = cars.map(car => ({
      ...car,
      images: (() => { try { return JSON.parse(car.images || '[]'); } catch { return []; } })(),
      occupancy_days: occupancyMap[car.id] || 0,
      occupancy_rate: Math.min(100, Math.round(((occupancyMap[car.id] || 0) / 365) * 100)),
    }));

    const totalRevenue = allBookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + parseFloat(b.total_price), 0);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthRevenue = allBookings
      .filter(b => b.status === 'confirmed' && b.start_date.startsWith(currentMonth))
      .reduce((sum, b) => sum + parseFloat(b.total_price), 0);

    const totalOccupancyDays = Object.values(occupancyMap).reduce((s, d) => s + d, 0);
    const globalOccupancyRate = cars.length > 0
      ? Math.min(100, Math.round((totalOccupancyDays / (365 * cars.length)) * 100))
      : 0;

    res.json({
      summary: {
        total_revenue: Math.round(totalRevenue),
        month_revenue: Math.round(monthRevenue),
        total_bookings: allBookings.length,
        pending_bookings: allBookings.filter(b => b.status === 'pending').length,
        confirmed_bookings: allBookings.filter(b => b.status === 'confirmed').length,
        cancelled_bookings: allBookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length,
        total_cars: cars.length,
        active_cars: cars.filter(c => c.available).length,
        global_occupancy_rate: globalOccupancyRate,
        avg_owner_rating: ratingResult.rows[0]?.avg_owner_rating || null,
        total_reviews: ratingResult.rows[0]?.total_reviews || 0,
      },
      cars: carsWithStats,
      monthly_revenue: monthlyRevenueResult.rows,
      recent_bookings: recentBookingsResult.rows,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
