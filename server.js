const dns = require('node:dns');
dns.setServers(['1.1.1.1', '8.8.8.8']); 


require('dotenv').config();

const app = require('./src/app');
const dotenv = require('dotenv');
const connectDB = require("./src/config/db")
dotenv.config();

connectDB()

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

