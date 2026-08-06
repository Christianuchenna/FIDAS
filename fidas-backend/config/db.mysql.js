const mysql = require('mysql2/promise');

let pool;

const connectMySQL = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    });

    // Test the connection
    const conn = await pool.getConnection();
    console.log('✅ MySQL (Payment DB) connected');
    conn.release();
  } catch (error) {
    console.error(`❌ MySQL connection error: ${error.message}`);
    // Not fatal — system can run without it, OCR layer will flag unverifiable
  }
};

const getPool = () => pool;

module.exports = { connectMySQL, getPool };
