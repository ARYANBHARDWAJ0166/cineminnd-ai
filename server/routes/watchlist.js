const express = require("express");
const router = express.Router();
const passport = require("passport");
const axios = require("axios");
const User = require("../models/User");

const tmdb = axios.create({
    baseURL: "https://api.themoviedb.org/3",
    timeout: 5000,
});

// @route   GET /api/watchlist
router.get(
    "/",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select('watchlist');
            if (!user) return res.status(404).json({ message: "User not found" });
            
            // Ensure we return numbers (MongoDB stores them as numbers)
            res.json({ 
                success: true, 
                watchlist: user.watchlist || [] 
            });
        } catch (error) {
            console.error("Error fetching watchlist:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// @route   GET /api/watchlist/details
router.get(
    "/details",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select('watchlist');
            if (!user || !user.watchlist || user.watchlist.length === 0) {
                return res.json({ success: true, movies: [] });
            }
            
            const movieDetailPromises = user.watchlist.map(movieId => 
                tmdb.get(`/movie/${movieId}`, {
                    params: { api_key: process.env.TMDB_API_KEY }
                }).catch(err => {
                    console.error(`Failed to fetch movie ${movieId}:`, err.message);
                    return null; // Handle individual movie fetch failures gracefully
                })
            );
            
            const movieResponses = await Promise.all(movieDetailPromises);
            const movies = movieResponses
                .filter(response => response !== null)
                .map(response => {
                    const movie = response.data;
                    return {
                        id: movie.id, // TMDB returns number
                        title: movie.title,
                        overview: movie.overview,
                        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
                        poster: movie.poster_path 
                            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
                            : "https://via.placeholder.com/500x750?text=No+Image",
                        releaseDate: movie.release_date || "Unknown",
                        voteCount: movie.vote_count || 0
                    };
                });
            
            res.json({ success: true, movies });
        } catch (error) {
            console.error("Error fetching watchlist details:", error);
            res.status(500).json({ message: "Server error while fetching watchlist details" });
        }
    }
);

// @route   POST /api/watchlist/add
router.post(
    "/add",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        try {
            let { movieId } = req.body;
            
            // Convert to number if it's a string
            movieId = Number(movieId);
            
            if (!movieId || isNaN(movieId)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Valid Movie ID is required" 
                });
            }
            
            const user = await User.findByIdAndUpdate(
                req.user.id,
                { $addToSet: { watchlist: movieId } },
                { new: true, select: 'watchlist' }
            );
            
            if (!user) {
                return res.status(404).json({ 
                    success: false,
                    message: "User not found" 
                });
            }
            
            res.json({ 
                success: true, 
                message: "Movie added to watchlist",
                watchlist: user.watchlist // Return updated watchlist for sync
            });
        } catch (error) {
            console.error("Error adding to watchlist:", error);
            res.status(500).json({ 
                success: false,
                message: "Server error while adding to watchlist" 
            });
        }
    }
);

// @route   DELETE /api/watchlist/remove/:id
router.delete(
    "/remove/:id",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        try {
            const movieId = Number(req.params.id);
            
            if (isNaN(movieId)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Invalid Movie ID" 
                });
            }
            
            const user = await User.findByIdAndUpdate(
                req.user.id,
                { $pull: { watchlist: movieId } },
                { new: true, select: 'watchlist' }
            );
            
            if (!user) {
                return res.status(404).json({ 
                    success: false,
                    message: "User not found" 
                });
            }
            
            res.json({ 
                success: true, 
                message: "Movie removed from watchlist",
                watchlist: user.watchlist // Return updated watchlist for sync
            });
        } catch (error) {
            console.error("Error removing from watchlist:", error);
            res.status(500).json({ 
                success: false,
                message: "Server error while removing from watchlist" 
            });
        }
    }
);

// @route   POST /api/watchlist/sync (Optional - for bulk sync)
router.post(
    "/sync",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        try {
            const { watchlist } = req.body;
            
            if (!Array.isArray(watchlist)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Watchlist must be an array" 
                });
            }
            
            // Ensure all IDs are numbers
            const numericWatchlist = watchlist.map(id => Number(id)).filter(id => !isNaN(id));
            
            const user = await User.findByIdAndUpdate(
                req.user.id,
                { watchlist: numericWatchlist },
                { new: true, select: 'watchlist' }
            );
            
            res.json({ 
                success: true, 
                message: "Watchlist synced successfully",
                watchlist: user.watchlist
            });
        } catch (error) {
            console.error("Error syncing watchlist:", error);
            res.status(500).json({ 
                success: false,
                message: "Server error while syncing watchlist" 
            });
        }
    }
);

module.exports = router;