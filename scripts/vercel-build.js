const { execSync } = require('child_process');

console.log('🚀 Running Prompter production build preparation...');

// 1. Resolve DATABASE_URL from Vercel Postgres/Neon environment variables if not directly set
if (!process.env.DATABASE_URL) {
  if (process.env.POSTGRES_PRISMA_URL) {
    console.log('🔗 Mapping Vercel POSTGRES_PRISMA_URL to DATABASE_URL');
    process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
  } else if (process.env.POSTGRES_URL) {
    console.log('🔗 Mapping Vercel POSTGRES_URL to DATABASE_URL');
    process.env.DATABASE_URL = process.env.POSTGRES_URL;
  }
}

const hasValidDbUrl =
  process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.startsWith('postgresql://') ||
    process.env.DATABASE_URL.startsWith('postgres://'));

if (!hasValidDbUrl) {
  console.warn('\n========================================================================');
  console.warn('⚠️  NOTICE: DATABASE_URL is not set or invalid in Vercel Environment Variables.');
  console.warn('   Expected format: postgresql://<user>:<password>@<host>:5432/<dbname>?sslmode=require');
  console.warn('   Generating Prisma Client with build fallback so compilation succeeds.');
  console.warn('   Make sure to configure DATABASE_URL in Vercel -> Project Settings -> Environment Variables.');
  console.warn('========================================================================\n');

  // Provide dummy PostgreSQL URL so prisma generate can compile client types during build
  process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy?schema=public';
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
  execSync('npx next build', { stdio: 'inherit', env: process.env });
  process.exit(0);
}

// 2. Normal flow with valid PostgreSQL URL
console.log('✔ Valid PostgreSQL connection detected.');
console.log('Generating Prisma Client...');
execSync('npx prisma generate', { stdio: 'inherit', env: process.env });

try {
  console.log('Synchronizing schema with PostgreSQL database (prisma db push)...');
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

console.log('Building Next.js application...');
execSync('npx next build', { stdio: 'inherit', env: process.env });
console.log('🎉 Production build completed successfully!');
