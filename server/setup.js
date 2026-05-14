#!/usr/bin/env node
/**
 * SOS DIGITAL — Database Setup Script
 * Run this after configuring your DATABASE_URL in server/.env
 *
 * Usage:  node setup.js
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('\n🚀 SOS DIGITAL — Database Setup\n');

try {
  // 1. Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { cwd: __dirname, stdio: 'inherit' });

  // 2. Push schema to DB
  console.log('\n🗄️  Pushing schema to database...');
  execSync('npx prisma db push', { cwd: __dirname, stdio: 'inherit' });

  // 3. Seed the database
  console.log('\n🌱 Seeding database...');
  execSync('node prisma/seed.js', { cwd: __dirname, stdio: 'inherit' });

  console.log('\n✅ Setup complete!');
  console.log('\n🔑 Default admin credentials:');
  console.log('   Email:    admin@sosdigital.cm');
  console.log('   Password: Admin@SOS2024\n');
  console.log('🌐 Start the app:');
  console.log('   npm run dev  (in server/)');
  console.log('   npm run dev  (in client/)\n');
} catch (err) {
  console.error('\n❌ Setup failed:', err.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   1. Make sure PostgreSQL is running');
  console.log('   2. Update DATABASE_URL in server/.env with your postgres password');
  console.log('   3. The database "sos_digital" will be created automatically\n');
  process.exit(1);
}
