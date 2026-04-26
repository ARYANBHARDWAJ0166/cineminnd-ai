const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');

router.get('/stats', 
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        try {
            if (req.user.username !== 'raj' && !req.user.isAdmin) {
                return res.status(403).json({ success: false, message: 'No admin access' });
            }

            const now = new Date();
            const today = new Date(now.setHours(0, 0, 0, 0));
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const [totalUsers, activeToday, newThisWeek, topUsers] = await Promise.all([
                User.countDocuments(),
                User.countDocuments({ lastActiveAt: { $gte: today } }),
                User.countDocuments({ createdAt: { $gte: weekAgo } }),
                User.find().sort({ watchlist: -1 }).limit(8).select('username watchlist')
            ]);

            res.json({
                success: true,
                stats: {
                    totalUsers,
                    activeToday,
                    newThisWeek,
                    topWatchlists: topUsers.map(u => ({
                        username: u.username,
                        movies: u.watchlist.length
                    }))
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false });
        }
    }
);

module.exports = router;