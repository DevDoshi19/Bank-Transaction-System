const express = require("express");
const router = express.Router();

// controllers
const { createAccount } = require("../controllers/account.controller");

// middleware
const authMiddleware = require("../middleware/auth.middleware");

/**
 * - POST api/accounts/create
 * - create a new account 
 * - protected route, requires authentication
 */

router.post("/create", authMiddleware, createAccount)

module.exports = router;