const express = require('express');
const app = express();

app.get("/", (req, res) => {
  res.send("Welcome to advanced banking system");
});

module.exports = app;
