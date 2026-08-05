import { prisma } from './src/config/database.js';

async function main() {
  console.log('Adding "orderName" column to "Order" table...');
  await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderName" TEXT;`);
  console.log('Added "orderName" column successfully!');

  await prisma.$executeRawUnsafe(`
    UPDATE "Order" SET "orderName" = 'Monthly Medical Supplies Order' WHERE "orderNumber" = 'SO-2026-001';
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "Order" SET "orderName" = 'Bulk Paracetamol & Syrup Order' WHERE "orderNumber" = 'SO-2026-002';
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "Order" SET "orderName" = 'Quarterly Antibiotics Supply' WHERE "orderNumber" = 'SO-2026-003';
  `);
  console.log('Updated order names for existing orders!');

  const orders = await prisma.$queryRaw`
    SELECT "id"::text, "orderNumber"::text, "orderName"::text, "status"::text, "totalAmount"::text, "createdAt"::text FROM "Order";
  `;
  console.log('ORDERS IN DB NOW:', orders);
}

main().catch(console.error).finally(() => prisma.$disconnect());
