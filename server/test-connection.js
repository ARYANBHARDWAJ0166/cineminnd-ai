// test-connection.js
require("dotenv").config();
const axios = require("axios");
const https = require('https');
const dns = require('dns');

const agent = new https.Agent({
    keepAlive: false,
    lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { ...options, family: 4 }, callback);
    }
});

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function runTest() {
    if (!TMDB_API_KEY) {
        console.error("❌ API Key not found in .env file!");
        return;
    }
    console.log("▶️  Running the definitive connection test...");
    try {
        await axios.get(
            "https://api.themoviedb.org/3/discover/movie",
            {
                params: { api_key: TMDB_API_KEY, with_original_language: "en" },
                httpsAgent: agent,
                timeout: 15000
            }
        );
        console.log("\n✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅");
        console.log("✅    SUCCESS! THE CONNECTION WORKED!   ✅");
        console.log("✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅");
        console.log("\nThe problem is solved by fixing your security software.");
    } catch (error) {
        console.error("\n❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌");
        console.error("❌    FAILURE! CONNECTION WAS RESET!    ❌");
        console.error("❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌");
        console.error("\nThis proves software on your PC is blocking Node.js.");
        console.error("Error Code:", error.code);
    }
}
runTest();