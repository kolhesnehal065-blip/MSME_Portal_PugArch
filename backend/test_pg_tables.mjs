import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    console.log('EXISTING TABLES:', res.rows.map(r => r.table_name).join(', '));
    
    const mig = await client.query("SELECT * FROM information_schema.tables WHERE table_name = '_prisma_migrations'");
    if (mig.rows.length > 0) {
        const hist = await client.query("SELECT migration_name FROM _prisma_migrations");
        console.log('MIGRATION HISTORY IN DB:', hist.rows.map(r => r.migration_name));
    } else {
        console.log('NO _prisma_migrations TABLE FOUND AT ALL.');
    }
    await client.end();
  } catch (err) { console.error(err); }
}
main();
