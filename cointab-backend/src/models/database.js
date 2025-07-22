import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres",
});

export const query = (text, params) => pool.query(text, params);

export const getClient = () => pool.connect();

export default pool;