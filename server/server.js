require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");

const app = express();

// ✅ CORS FIX
app.use(cors());
app.options('*', cors());

app.use(express.json());
app.use(passport.initialize());

// Passport Config
require("./config/passport")(passport);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/recommend", require("./routes/recommend"));
app.use("/api/movies", require("./routes/movies"));
app.use("/api/watchlist", require("./routes/watchlist"));
app.use("/api/admin", require("./routes/admin"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => 
  console.log(`Server running on port ${PORT}`)
);
