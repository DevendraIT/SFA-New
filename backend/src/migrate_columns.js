import { prisma } from './config/database.js';

async function run() {
  console.log('Migrating database location columns...');
  await prisma.$executeRawUnsafe('ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION, ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;');
  console.log('✓ Branch columns: latitude, longitude');

  await prisma.$executeRawUnsafe('ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION, ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;');
  console.log('✓ Customer columns: latitude, longitude');

  await prisma.$executeRawUnsafe('ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "pickupAddress" TEXT, ADD COLUMN IF NOT EXISTS "pickupLatitude" DOUBLE PRECISION, ADD COLUMN IF NOT EXISTS "pickupLongitude" DOUBLE PRECISION, ADD COLUMN IF NOT EXISTS "destinationAddress" TEXT, ADD COLUMN IF NOT EXISTS "destinationLatitude" DOUBLE PRECISION, ADD COLUMN IF NOT EXISTS "destinationLongitude" DOUBLE PRECISION;');
  console.log('✓ Task columns: pickupAddress, pickupLatitude, pickupLongitude, destinationAddress, destinationLatitude, destinationLongitude');

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
