const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false
};


if (!isProduction && !process.env.DATABASE_URL) {
  connectionConfig.host = process.env.DB_HOST;
  connectionConfig.user = process.env.DB_USER;
  connectionConfig.password = process.env.DB_PASSWORD;
  connectionConfig.database = process.env.DB_NAME;
  connectionConfig.ssl = false; 
}

const pool = new Pool(connectionConfig);

// Función para verificar la conexión al iniciar
async function checkConnection() {
    try {
        const client = await pool.connect();
        console.log('¡Conexión exitosa a la base de datos PostgreSQL!');
        client.release();
    } catch (error) {
        console.error('Error al conectar a la base de datos PostgreSQL:', error);
    }
}

checkConnection();


module.exports = pool;