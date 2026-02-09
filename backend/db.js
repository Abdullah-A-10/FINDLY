const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'findly_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const connectDB = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('> Database connected');
  } catch (error) {
    console.error('> Database connection failed');
    console.error(error);
    process.exit(1);
  }
};

module.exports = {pool , connectDB } ;