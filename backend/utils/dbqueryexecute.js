const { Pool } = require("pg");
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = {
  pool,
  queryExecute: function (obj) {
    return new Promise((resolve, reject) => {
      pool
        .query(obj.queryString, obj.params || [])
        .then((result) => {
          resolve(result.rows);
        })
        .catch((err) => {
          console.error("Query Error:", err);
          reject(err);
        });
    });
  },
  queryExecuteId: function (obj) {
    return new Promise((resolve, reject) => {
      pool
        .query(obj.queryString, obj.params || [])
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          console.error("Query Error:", err);
          reject(err);
        });
    });
  },
};