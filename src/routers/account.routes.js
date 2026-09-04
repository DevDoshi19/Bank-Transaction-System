const express = require("express");
const router = express.Router();

// controllers
const accountController = require("../controllers/account.controller");
// middleware
const { authMiddleware } = require("../middleware/auth.middleware");

/**
 * - POST api/accounts/create
 * - create a new account 
 * - protected route, requires authentication
 */

router.post("/create", authMiddleware, accountController.createAccount)

/**
 * - GET api/accounts/
 * - get account details for the authenticated user
 */
router.get("/", authMiddleware, accountController.getUserAccounts)

/**
 * - GET api/accounts/balance/:accountId
 * - get account balance for the authenticated user
 */
router.get("/balance/:accountId", authMiddleware, accountController.getAccountBalance)


module.exports = router;