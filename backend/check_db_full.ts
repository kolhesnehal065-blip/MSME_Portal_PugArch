import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
    `;
    console.log('DB TABLES:', JSON.stringify(tables, null, 2));
    
    const migrations = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations;
    `.catch(e => 'No migrations table found');
    console.log('APPLIED MIGRATIONS:', JSON.stringify(migrations, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
