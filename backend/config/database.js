const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env'); // Adjust path if needed
dotenv.config({ path: envPath });

const dbConfig = {
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432
};

const pool = new Pool(dbConfig);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err);
});

module.exports = { pool };