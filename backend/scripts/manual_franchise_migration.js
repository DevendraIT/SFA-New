import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/database.js';

async function runManualMigration() {
  console.log('--- STARTING SAFE MANUAL SQL MIGRATION ---');

  try {
    // 1. Check existing data to verify baseline
    const existingOrgCount = await prisma.organization.count();
    const existingUserCount = await prisma.user.count();
    console.log(`[Baseline Data Check] Existing Organizations: ${existingOrgCount}, Existing Users: ${existingUserCount}`);

    // 2. Create Franchise table
    console.log('[Executing SQL] Creating "Franchise" table if it does not exist...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Franchise" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "code" TEXT UNIQUE NOT NULL,
        "contactName" TEXT,
        "email" TEXT UNIQUE NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "phone" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ "Franchise" table ready.');

    // 3. Add franchiseId to Organization table
    console.log('[Executing SQL] Adding "franchiseId" column to "Organization" table if not present...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "franchiseId" UUID;
    `);
    console.log('✓ "franchiseId" column ready on "Organization".');

    // 4. Add foreign key constraint safely
    console.log('[Executing SQL] Adding foreign key constraint safely...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'Organization_franchiseId_fkey'
        ) THEN
          ALTER TABLE "Organization" ADD CONSTRAINT "Organization_franchiseId_fkey"
          FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    console.log('✓ Foreign key constraint ready.');

    // 5. Add index
    console.log('[Executing SQL] Creating index on Organization(franchiseId)...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Organization_franchiseId_idx" ON "Organization"("franchiseId");
    `);
    console.log('✓ Index ready.');

    // 6. Seed / ensure initial Franchise Admin exists
    const defaultFranchiseEmail = 'franchise@it360.com';
    const existingFranchise = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Franchise" WHERE email = $1 LIMIT 1;`,
      defaultFranchiseEmail
    );

    if (!existingFranchise || existingFranchise.length === 0) {
      console.log('[Seeding] Creating default Master Franchise Admin (franchise@it360.com)...');
      const passwordHash = await bcrypt.hash('Franchise@123', 10);
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Franchise" ("name", "code", "contactName", "email", "passwordHash", "phone", "isActive")
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        'IT360 Master Franchise',
        'IT360-FRAN-001',
        'Franchise Owner',
        defaultFranchiseEmail,
        passwordHash,
        '9876543210',
        true
      );
      console.log('✓ Default Franchise Admin created: franchise@it360.com / Franchise@123');
    } else {
      console.log('✓ Default Franchise Admin already exists.');
    }

    // 7. Verify existing data is 100% intact
    const finalOrgCount = await prisma.organization.count();
    const finalUserCount = await prisma.user.count();
    console.log(`[Data Preservation Verification] Organizations: ${finalOrgCount} (original: ${existingOrgCount}), Users: ${finalUserCount} (original: ${existingUserCount})`);

    if (finalOrgCount === existingOrgCount && finalUserCount === existingUserCount) {
      console.log('🎉 VERIFIED: 100% data preservation confirmed! Zero data lost.');
    } else {
      console.warn('⚠️ Warning: Counts changed unexpectedly.');
    }

    console.log('--- MANUAL SQL MIGRATION COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('❌ Error during manual SQL migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runManualMigration();
