/**
 * Prepare Desktop Build
 * 
 * This script:
 * 1. Temporarily swaps Prisma provider to SQLite
 * 2. Generates a fresh template.db
 * 3. Restores the Prisma provider back to PostgreSQL
 * 4. Builds the client
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..');
const SERVER_DIR = path.join(ROOT, 'server');
const CLIENT_DIR = path.join(ROOT, 'client');
const SCHEMA_PATH = path.join(SERVER_DIR, 'prisma', 'schema.prisma');
const TEMPLATE_DB = path.join(SERVER_DIR, 'prisma', 'template.db');
const TEMP_DB = path.join(SERVER_DIR, 'prisma', 'dev.db');

console.log('\n🔧 SOS DIGITAL Desktop Build Preparation\n');

// Step 1: Read original schema
const originalSchema = fs.readFileSync(SCHEMA_PATH, 'utf8');

// Step 2: Swap to SQLite
console.log('1️⃣  Switching Prisma provider to SQLite...');
const sqliteSchema = originalSchema.replace(
  /provider\s*=\s*"postgresql"/g,
  'provider = "sqlite"'
);
fs.writeFileSync(SCHEMA_PATH, sqliteSchema);

// Step 3: Set temp DATABASE_URL for SQLite and push schema
const tempDbUrl = 'file:' + TEMP_DB.replace(/\\/g, '/');
console.log('2️⃣  Generating fresh SQLite database...');
try {
  execSync(`npx prisma db push --skip-generate --accept-data-loss`, {
    cwd: SERVER_DIR,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: tempDbUrl }
  });
} catch (e) {
  console.error('Failed to push schema:', e.message);
}

// Step 4: Copy to template.db
if (fs.existsSync(TEMP_DB)) {
  fs.copyFileSync(TEMP_DB, TEMPLATE_DB);
  fs.unlinkSync(TEMP_DB);
  console.log('3️⃣  template.db created successfully!');
} else {
  console.warn('⚠️  Could not create template.db');
}

// Step 5: Generate Prisma client for SQLite (needed at runtime)
console.log('4️⃣  Generating Prisma Client (SQLite)...');
execSync('npx prisma generate', {
  cwd: SERVER_DIR,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: tempDbUrl }
});

// Step 6: Restore original schema (PostgreSQL)
console.log('5️⃣  Restoring Prisma provider to PostgreSQL...');
fs.writeFileSync(SCHEMA_PATH, originalSchema);

// Step 7: Build the client
console.log('6️⃣  Building client...');
execSync('npm run build', { cwd: CLIENT_DIR, stdio: 'inherit' });

console.log('\n✅ Desktop preparation complete! Run "npm run build" in desktop/ to create the installer.\n');
