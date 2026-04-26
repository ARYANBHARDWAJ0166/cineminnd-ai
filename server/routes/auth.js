const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// @route   POST /api/auth/register
// @desc   Register a new user
router.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: "Please provide username, email, and password" });
  }

  // Check if user exists
  User.findOne({ $or: [{ username }, { email }] })
    .then(user => {
      if (user) {
        if (user.username === username) {
          return res.status(400).json({ success: false, message: "Username already exists" });
        }
        return res.status(400).json({ success: false, message: "Email already exists" });
      }

      // Create new user
      const newUser = new User({ username, email, password: "" });

      // Hash password
      bcrypt.genSalt(10, (err, salt) => {
        if (err) throw err;
        bcrypt.hash(password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser.save()
            .then(user => res.json({ success: true, message: "Registration successful!" }))
            .catch(err => {
              console.error("Save error:", err);
              res.status(500).json({ success: false, message: "Error saving user" });
            });
        });
      });
    })
    .catch(err => {
      console.error("Database error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    });
});

// @route   POST /api/auth/login
// @desc   Login user
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  User.findOne({ username })
    .then(user => {
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      bcrypt.compare(password, user.password)
        .then(isMatch => {
          if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect password" });
          }

          const payload = { id: user.id, username: user.username };
          jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: "30d" },
            (err, token) => {
              if (err) throw err;
              res.json({
                success: true,
                token: `Bearer ${token}`,
                username: user.username
              });
            }
          );
        })
        .catch(err => {
          console.error("Login error:", err);
          res.status(500).json({ success: false, message: "Server error" });
        });
    })
    .catch(err => {
      console.error("Database error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    });
});

module.exports = router;