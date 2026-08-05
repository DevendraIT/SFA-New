import { prisma } from './src/config/database.js';

async function main() {
  console.log('Querying information_schema.columns for "Order" table...');
  const columns = await prisma.$queryRaw`
    SELECT column_name::text, data_type::text, is_nullable::text
    FROM information_schema.columns
    WHERE table_name = 'Order'
    ORDER BY column_name;
  `;
  console.log('ACTUAL COLUMNS IN "Order" TABLE IN POSTGRESQL:');
  console.log(columns);
}

main().catch(console.error).finally(() => prisma.$disconnect());
