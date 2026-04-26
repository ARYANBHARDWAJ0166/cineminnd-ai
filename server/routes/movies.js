// server/routes/movies.js
require('dotenv').config();
const express = require("express");
const router = express.Router();
const passport = require("passport");
const axios = require("axios");

// @route   GET /api/movies/explore
// @desc    Get trending and now playing movies for the Explore page
// @access  Private
router.get(
    "/explore",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        const TMDB_API_KEY = process.env.TMDB_API_KEY;
        const trendingUrl = `https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`;
        const nowPlayingUrl = `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&region=US`;

        try {
            // Fetch both lists in parallel
            const [trendingResponse, nowPlayingResponse] = await Promise.all([
                axios.get(trendingUrl),
                axios.get(nowPlayingUrl),
            ]);

            // Helper to format movies
            const formatMovies = (movies) => movies.map(movie => ({
                id: movie.id,
                title: movie.title,
                rating: movie.vote_average.toFixed(1),
                poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "https://via.placeholder.com/500x750.png?text=No+Image"
            }));

            res.json({
                success: true,
                trending: formatMovies(trendingResponse.data.results),
                nowPlaying: formatMovies(nowPlayingResponse.data.results),
            });

        } catch (error) {
            console.error("Explore Page API Error:", error.message);
            res.status(500).json({ error: "Failed to fetch explore data." });
        }
    }
);

module.exports = router;