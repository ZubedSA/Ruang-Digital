import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_oABCY3lfFVu6@ep-noisy-firefly-b39a5fem-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30';

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasourceUrl: connectionString,
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export * from '@prisma/client';
