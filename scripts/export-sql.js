const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) {
    return `'${val.toISOString().slice(0, 23).replace('T', ' ')}'`;
  }
  // String escaping
  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\x00/g, '\\0');
  return `'${str}'`;
}

async function run() {
  console.log('Generating Prisma schema DDL...');
  const ddl = execSync(
    'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script',
    { encoding: 'utf8' }
  );

  const tables = [
    { name: 'User', model: prisma.user },
    { name: 'Category', model: prisma.category },
    { name: 'Subcategory', model: prisma.subcategory },
    { name: 'Prompt', model: prisma.prompt },
    { name: 'Advertisement', model: prisma.advertisement },
    { name: 'NotificationSetting', model: prisma.notificationSetting },
    { name: 'Notification', model: prisma.notification },
    { name: 'FcmDeviceToken', model: prisma.fcmDeviceToken },
    { name: 'AppSettings', model: prisma.appSettings },
    { name: 'AppUrls', model: prisma.appUrls },
    { name: 'ActivityLog', model: prisma.activityLog },
    { name: 'LoginLog', model: prisma.loginLog },
    { name: 'AppUser', model: prisma.appUser },
    { name: 'PromptLike', model: prisma.promptLike },
    { name: 'PromptActivity', model: prisma.promptActivity },
    { name: 'TrendingSetting', model: prisma.trendingSetting },
    { name: 'UploadedFile', model: prisma.uploadedFile },
  ];

  let sql = '';
  sql += '-- =========================================================================\n';
  sql += '-- Prompter MySQL Database Dump for Hostinger (phpMyAdmin / MySQL 8.x)\n';
  sql += '-- Generated on: ' + new Date().toISOString() + '\n';
  sql += '-- =========================================================================\n\n';
  sql += 'SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0;\n';
  sql += 'SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n';
  sql += 'SET NAMES utf8mb4;\n\n';

  // Drop tables in reverse order just in case
  sql += '-- -------------------------------------------------------------------------\n';
  sql += '-- Drop existing tables if they exist\n';
  sql += '-- -------------------------------------------------------------------------\n';
  for (let i = tables.length - 1; i >= 0; i--) {
    sql += `DROP TABLE IF EXISTS \`${tables[i].name}\`;\n`;
  }
  sql += '\n';

  // Schema DDL
  sql += '-- -------------------------------------------------------------------------\n';
  sql += '-- Table Structures and Foreign Key Constraints\n';
  sql += '-- -------------------------------------------------------------------------\n';
  sql += ddl + '\n\n';

  // Data Inserts
  sql += '-- -------------------------------------------------------------------------\n';
  sql += '-- Records / Data Inserts\n';
  sql += '-- -------------------------------------------------------------------------\n';
  for (const table of tables) {
    const rows = await table.model.findMany();
    if (rows.length === 0) continue;

    console.log(`Exporting ${rows.length} rows for ${table.name}...`);
    sql += `\n-- Data for table \`${table.name}\` (${rows.length} records)\n`;

    const cols = Object.keys(rows[0]);
    const colList = cols.map(c => `\`${c}\``).join(', ');

    for (const row of rows) {
      const valList = cols.map(c => escapeSql(row[c])).join(', ');
      sql += `INSERT INTO \`${table.name}\` (${colList}) VALUES (${valList});\n`;
    }
  }

  sql += '\nSET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;\n';
  sql += 'SET SQL_MODE = @OLD_SQL_MODE;\n';

  const outPath = path.join(process.cwd(), 'prompter_backup.sql');
  fs.writeFileSync(outPath, sql, { encoding: 'utf8' });
  console.log(`\nSuccessfully exported clean UTF-8 MySQL dump to: ${outPath} (${fs.statSync(outPath).size} bytes)`);

  await prisma.$disconnect();
}

run().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
