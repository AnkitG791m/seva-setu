// Admin seed script - creates admin user in Firebase + DB
// Run: node create_admin.js

import admin from './server/src/lib/firebase.js';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server', '.env') });

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || 'file:./server/prisma/dev.db' } }
});

const ADMIN_EMAIL    = 'admin@sevasetu.app';
const ADMIN_PASSWORD = 'SevaSetu@2026';
const ADMIN_NAME     = 'SevaSetu Admin';

async function main() {
  console.log('Creating Firebase Admin user...');

  let fbUser;
  try {
    // Try to get existing user first
    fbUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    console.log('Firebase user already exists:', fbUser.uid);
  } catch {
    // Create new user
    fbUser = await admin.auth().createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: ADMIN_NAME,
      emailVerified: true,
    });
    console.log('Firebase user created:', fbUser.uid);
  }

  // Upsert in DB
  const existing = await prisma.user.findUnique({ where: { firebase_uid: fbUser.uid } });
  if (existing) {
    // Update role to COORDINATOR if needed
    const updated = await prisma.user.update({
      where: { firebase_uid: fbUser.uid },
      data: { role: 'COORDINATOR', name: ADMIN_NAME, email: ADMIN_EMAIL }
    });
    console.log('DB user updated to COORDINATOR:', updated.id);
  } else {
    const user = await prisma.user.create({
      data: {
        firebase_uid: fbUser.uid,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        role: 'COORDINATOR',
      }
    });
    console.log('DB user created as COORDINATOR:', user.id);
  }

  console.log('\n========================================');
  console.log('   ADMIN CREDENTIALS (Save these!)');
  console.log('========================================');
  console.log('  Email   :', ADMIN_EMAIL);
  console.log('  Password:', ADMIN_PASSWORD);
  console.log('  Role    : COORDINATOR');
  console.log('  Login at: https://seva-setu-74bcc.web.app/login');
  console.log('========================================\n');

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
