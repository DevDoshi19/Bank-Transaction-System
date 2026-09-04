const {Router} = require("express");
const { createTransaction } = require("../controllers/transaction.controller");
const authMiddleware = require("../middleware/auth.middleware");
const trancationcontroller = require("../controllers/transaction.controller");
const transactionRouter = Router();
/**
 *  - POST /api/transactions
 *  - Create a new transaction
 */

transactionRouter.post("/", authMiddleware.authMiddleware, trancationcontroller.createTransaction);

/**
 * - POST /api/transactions/system/initial-funds
 * - create initial funds transaction from system user
 */

transactionRouter.post("/system/initial-funds", authMiddleware.authsystemUserMiddleware, trancationcontroller.createInitialFundsTransaction);


module.exports = transactionRouter;