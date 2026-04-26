require("dotenv").config(); // Must be first line

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Passport Config
require("./config/passport")(passport);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/recommend", require("./routes/recommend"));
app.use("/api/movies", require("./routes/movies"));
app.use("/api/watchlist", require("./routes/watchlist"));
app.use('/api/admin', require('./routes/admin'));

// User activity tracking (single instance)
app.use(async (req, res, next) => {
  try {
    if (req.user) {
      const User = require("./models/User");
      await User.findByIdAndUpdate(req.user.id, { lastActiveAt: new Date() });
    }
  } catch (err) {
    console.error("Activity tracking error:", err);
  }
  next();
});

// Production frontend serving
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client')));

  // Handle React routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'index.html'));
  });
}

// Only start server if run directly (not required for Railway)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app; // Required for Railway