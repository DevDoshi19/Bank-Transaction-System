const express = require("express");
const cookies = require("cookie-parser");
const app = express();

// middleware
app.use(express.json());
app.use(cookies());

/**
 *  Routers  
 */

const authRouter = require("./routers/auth.routes");
const accountRouter = require("./routers/account.routes");
const transactionRouter = require("./routers/transaction.routes");

// routers uses

app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions",transactionRouter);
// default route
app.get("/", (req, res) => {
  res.send("Welcome to advanced banking system");
});

module.exports = app;
