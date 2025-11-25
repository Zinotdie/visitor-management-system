const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "visitor_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

console.log("🔌 Database config:", {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
});

const pool = mysql.createPool(dbConfig);

// Test connection
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ Database connected successfully");
    connection.release();
  })
  .catch((error) => {
    console.error("❌ Database connection failed:", error.message);
  });

module.exports = pool;
