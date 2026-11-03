// Restrict Tokio (Prisma's internal Rust runtime) and libuv from spawning 64+ threads on multi-core servers
if (!process.env.TOKIO_WORKER_THREADS) {
  process.env.TOKIO_WORKER_THREADS = '1';
}
if (!process.env.UV_THREADPOOL_SIZE) {
  process.env.UV_THREADPOOL_SIZE = '1';
}

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Always store singleton in globalThis so multiple modules/pages never spawn duplicate Rust runtimes
globalForPrisma.prisma = prisma;

export default prisma;
