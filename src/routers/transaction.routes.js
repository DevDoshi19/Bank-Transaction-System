const {Router} = require("express");
const { createTransaction } = require("../controllers/transaction.controller");
const authMiddleware = require("../middleware/auth.middleware");

const transactionRouter = Router();
/**
 *  - POST /api/transactions
 *  - Create a new transaction
 */

transactionRouter.post("/", authMiddleware, createTransaction);

module.exports = transactionRouter;