import 'dotenv/config';
import dns from 'node:dns';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/index.js';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // ignore
}

const { Pool } = pg;
let prismaInstance;
let poolInstance;

/**
 * Get Prisma client instance (singleton pattern)
 * Ensures only one database connection across the application
 */
export const getPrismaClient = () => {
  if (prismaInstance) {
    return prismaInstance;
  }

  const connectionString = (process.env.DATABASE_URL || process.env.DIRECT_URL || '').replace(/['"]/g, '');

  poolInstance = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
  });

  poolInstance.on('error', (err) => {
    console.error('Unexpected pool error:', err.message);
  });

  const adapter = new PrismaPg(poolInstance);

  prismaInstance = new PrismaClient({
    adapter,
    errorFormat: 'pretty',
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  // Handle disconnection gracefully
  process.on('SIGINT', async () => {
    if (poolInstance) await poolInstance.end();
    if (prismaInstance) await prismaInstance.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    if (poolInstance) await poolInstance.end();
    if (prismaInstance) await prismaInstance.$disconnect();
    process.exit(0);
  });

  return prismaInstance;
};

export const prisma = getPrismaClient();

export default prisma;
