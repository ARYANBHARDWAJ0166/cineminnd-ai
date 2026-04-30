require("dotenv").config();
const express = require("express");
const router = express.Router();
const passport = require("passport");
const Groq = require("groq-sdk");
const axios = require("axios");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tmdb = axios.create({ 
    baseURL: "https://api.themoviedb.org/3", 
    timeout: 8000 
});

const fetchWithRetry = async (config, retries = 3) => {
    try { 
        return await tmdb(config); 
    } catch (error) {
        if (retries > 0) { 
            console.log(`Retrying TMDB... (${retries})`); 
            return fetchWithRetry(config, retries - 1); 
        }
        throw error;
    }
};

const genreMap = {
  action: 28, adventure: 12, animation: 16, comedy: 35, crime: 80,
  documentary: 99, drama: 18, family: 10751, fantasy: 14, history: 36,
  horror: 27, music: 10402, mystery: 9648, romance: 10749,
  "sci-fi": 878, "science fiction": 878, thriller: 53, war: 10752, western: 37,
};

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { message: userMessage, page = 1, exclude = [] } = req.body;
    if (!userMessage) return res.status(400).json({ error: "No message provided." });
    console.log(`User: ${req.user.username} | Query: "${userMessage}" | Page: ${page}`);

    try {
      const completion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
              { role: "system", content: `You are a highly engaging, witty, and expert Movie Recommendation Assistant named 'Movie-Bhai'.

Your personality:
1. VERY IMPORTANT: Detect the language of the user's message.
   - If the user writes in pure English, you MUST reply in English only.
   - If the user writes in Hinglish (mix of Hindi and English), you MUST reply in Hinglish.
   - If the user writes in Hindi, you MUST reply in Hindi.
   - Always match the user's language style exactly.
2. Never give short answers. Explain WHY you are suggesting each movie in a fun way.

4. Talk like a cool and friendly movie expert friend.

Your task:
1. Detect the language style of the user message.
2. Analyze the user's request carefully.
3. Reply in the SAME language style as the user.
4. At the VERY END of your response, you MUST provide a single clean JSON block with TMDB search parameters.

Allowed JSON keys: genres (array), keywords (array), year (number), language ('hi' or 'en').

Examples:

Example 1 - User writes in English:
User: "I want a mind bending sci-fi movie"
Response: "Whoa! You want your mind completely blown? 🤯 Here are some incredible mind-bending sci-fi movies that will leave you questioning reality!
{"genres":["sci-fi"],"keywords":["mind-bending","twist ending"]}"

Example 2 - User writes in Hinglish:
User: "yaar koi achhi horror movie batao"
Response: "Arre bhai! Horror movie chahiye? 👻 Pakad lo apna dil! Ye movies dekh ke raat ko neend nahi aayegi!
{"genres":["horror"],"keywords":["scary","supernatural","ghost"]}"

Example 3 - User writes in Hindi:
User: "कोई अच्छी romantic movie बताओ"
Response: "अरे वाह! रोमांटिक मूड में हो? 💕 ये movies दिल को छू जाएंगी!
{"genres":["romance"],"keywords":["love story","emotional","romantic"]}"
`},
              { role: "user", content: userMessage },
          ],
      });

      const aiRawText = completion.choices?.[0]?.message?.content;
      if (!aiRawText) throw new Error("Empty AI response");

      let conversationalText = aiRawText;
      let parsedQuery = {};

      const jsonMatch = aiRawText.match(/{[\s\S]*}/);
      if (jsonMatch) {
          try {
              parsedQuery = JSON.parse(jsonMatch[0]);
              conversationalText = aiRawText.replace(jsonMatch[0], "").trim();
          } catch (e) {
              console.error("Failed to parse JSON from AI response.");
          }
      }

      console.log("Conversational Text:", conversationalText);
      console.log("Parsed Query:", parsedQuery);
      
      let params = { 
          api_key: process.env.TMDB_API_KEY, 
          sort_by: "popularity.desc", 
          "vote_count.gte": 100, 
          include_adult: false, 
          page: page 
      };

      if (parsedQuery.language) params.with_original_language = parsedQuery.language;
      if (parsedQuery.year) params.primary_release_year = parsedQuery.year;

      if (Array.isArray(parsedQuery.genres)) {
        const genreIds = parsedQuery.genres.flatMap((g) => {
          const val = g.toLowerCase();
          if (val.includes("romantic")) return [10749]; 
          if (val.includes("comedy")) return [35];
          if (val.includes("action")) return [28]; 
          if (val.includes("thriller")) return [53];
          if (val.includes("horror")) return [27];
          return genreMap[val] ? [genreMap[val]] : [];
        });
        if (genreIds.length > 0) params.with_genres = genreIds.join(",");
      }

      const tmdbResponse = await fetchWithRetry({ 
          method: "GET", 
          url: "/discover/movie", 
          params 
      });

      const { results, page: currentPage, total_pages: totalPages } = tmdbResponse.data;

      if (!results || results.length === 0) {
        return res.json({ 
            success: true, 
            movies: [], 
            has_more: false, 
            message: "No movies found" 
        });
      }

      const filteredResults = results.filter(movie => !exclude.includes(movie.id));
      
      const movies = filteredResults.map((movie) => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        poster: movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : "https://via.placeholder.com/500x750?text=No+Image",
        why: movie.overview.substring(0, 100) + '...'
      }));
      
      const hasMore = currentPage < totalPages;
      
      return res.json({ 
          success: true, 
          responseText: conversationalText, 
          movies, 
          has_more: hasMore 
      });

    } catch (error) {
      console.error("FULL ERROR:", error.message);
      return res.status(500).json({ 
          success: false, 
          error: "Failed to get recommendation" 
      });
    }
  }
);

// ==============================
// 🎬 TRAILER ROUTE
// ==============================

router.get(
  "/trailer/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const movieId = req.params.id;

    try {
      const response = await fetchWithRetry({
        method: "GET",
        url: `/movie/${movieId}/videos`,
        params: { api_key: process.env.TMDB_API_KEY }
      });

      const videos = response.data.results;

      if (!videos || videos.length === 0) {
        return res.json({ success: false, message: "No trailer found" });
      }

      const trailer =
        videos.find(vid => vid.type === "Trailer" && vid.site === "YouTube") ||
        videos.find(vid => vid.site === "YouTube");

      if (!trailer) {
        return res.json({ success: false, message: "No YouTube trailer found" });
      }

      return res.json({ success: true, trailerKey: trailer.key });

    } catch (error) {
      console.error("Trailer fetch error:", error.message);
      return res.status(500).json({ 
          success: false, 
          message: "Failed to fetch trailer" 
      });
    }
  }
);

module.exports = router;
