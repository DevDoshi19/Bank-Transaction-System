const express = require('express');
const authRouter = require('./routers/auth.routers');
const cookies = require("cookie-parser")
const app = express();

app.use(express.json());
app.use(cookies())

app.use("/api/auth",authRouter)

app.get("/", (req, res) => {
  res.send("Welcome to advanced banking system");
});

module.exports = app;
