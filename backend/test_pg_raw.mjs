import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log('Initiating connection...');
    await client.connect();
    console.log('SUCCESS Connected to PostgreSQL!');
    const res = await client.query('SELECT pg_backend_pid(), current_user');
    console.log('DATA:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('CRITICAL FAILURE:', err);
  }
}
main();
