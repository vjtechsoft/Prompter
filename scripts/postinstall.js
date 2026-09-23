const { execSync } = require('child_process');

// Automatically resolve Vercel Postgres variables if DATABASE_URL is not directly set
if (!process.env.DATABASE_URL) {
  if (process.env.POSTGRES_PRISMA_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
  } else if (process.env.POSTGRES_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL;
  }
}

// Fallback dummy PostgreSQL URL so prisma generate always succeeds during npm install / postinstall
if (
  !process.env.DATABASE_URL ||
  (!process.env.DATABASE_URL.startsWith('postgresql://') &&
    !process.env.DATABASE_URL.startsWith('postgres://'))
) {
  process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy?schema=public';
}

try {
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
} catch (err) {
  console.warn('⚠️ Warning: prisma generate during postinstall encountered an issue, will retry in build step.');
}
