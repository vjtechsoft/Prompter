const { execSync } = require('child_process');

// Cap threadpools to prevent Hostinger / CloudLinux OS error 11 (thread exhaustion)
process.env.TOKIO_WORKER_THREADS = process.env.TOKIO_WORKER_THREADS || '1';
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '1';
process.env.NEXT_CPU_NUM = process.env.NEXT_CPU_NUM || '1';
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=2048';

console.log('🚀 Running Prompter production build preparation (MySQL)...');

// Resolve DATABASE_URL from environment variables if not directly set
if (!process.env.DATABASE_URL) {
  if (process.env.MYSQL_URL) {
    console.log('🔗 Mapping MYSQL_URL to DATABASE_URL');
    process.env.DATABASE_URL = process.env.MYSQL_URL;
  } else if (process.env.PLANETSCALE_DATABASE_URL) {
    console.log('🔗 Mapping PLANETSCALE_DATABASE_URL to DATABASE_URL');
    process.env.DATABASE_URL = process.env.PLANETSCALE_DATABASE_URL;
  }
}

const hasValidDbUrl =
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL.startsWith('mysql://');

if (!hasValidDbUrl) {
  console.warn('\n========================================================================');
  console.warn('⚠️  NOTICE: DATABASE_URL is not set or invalid in Vercel Environment Variables.');
  console.warn('   Expected format: mysql://<user>:<password>@<host>:3306/<dbname>');
  console.warn('   Generating Prisma Client with build fallback so compilation succeeds.');
  console.warn('   Make sure to configure DATABASE_URL in Vercel -> Project Settings -> Environment Variables.');
  console.warn('========================================================================\n');

  // Provide dummy MySQL URL so prisma generate can compile client types during build
  process.env.DATABASE_URL = 'mysql://dummy:dummy@localhost:3306/dummy';
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
  const fallbackEnv = {
    ...process.env,
    NEXT_CPU_NUM: process.env.NEXT_CPU_NUM || '1',
    NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=2048',
  };
  execSync('npx next build', { stdio: 'inherit', env: fallbackEnv });
  process.exit(0);
}

// Normal flow with valid MySQL URL
console.log('✔ Valid MySQL connection detected.');
console.log('Generating Prisma Client...');
execSync('npx prisma generate', { stdio: 'inherit', env: process.env });

try {
  console.log('Synchronizing schema with MySQL database (prisma db push)...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });
} catch (err) {
  console.warn('⚠️ Warning: prisma db push failed or timed out during build. Continuing build...');
}

try {
  console.log('Ensuring default Super Admin & seed data exists...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', env: process.env });
} catch (err) {
  console.warn('⚠️ Warning: seed step skipped or already initialized.');
}

console.log('Building Next.js application (single worker mode to respect Hostinger process limits)...');
const buildEnv = {
  ...process.env,
  NEXT_CPU_NUM: process.env.NEXT_CPU_NUM || '1',
  NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=2048',
};
execSync('npx next build', { stdio: 'inherit', env: buildEnv });
console.log('🎉 Production build completed successfully!');
