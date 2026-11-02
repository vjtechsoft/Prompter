const { execSync } = require('child_process');

// Automatically resolve environment variables if DATABASE_URL is not directly set
if (!process.env.DATABASE_URL) {
  if (process.env.MYSQL_URL) {
    process.env.DATABASE_URL = process.env.MYSQL_URL;
  } else if (process.env.PLANETSCALE_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.PLANETSCALE_DATABASE_URL;
  }
}

// Fallback dummy MySQL URL so prisma generate always succeeds during npm install / postinstall
if (
  !process.env.DATABASE_URL ||
  !process.env.DATABASE_URL.startsWith('mysql://')
) {
  process.env.DATABASE_URL = 'mysql://dummy:dummy@localhost:3306/dummy';
}

try {
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
} catch (err) {
  console.warn('⚠️ Warning: prisma generate during postinstall encountered an issue, will retry in build step.');
}
