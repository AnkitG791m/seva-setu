import admin from 'firebase-admin';
import { createRequire } from 'module';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

async function createUser() {
  try {
    const user = await admin.auth().createUser({
      email: 'demo@sevasetu.app',
      password: 'Demo@12345',
      displayName: 'Demo User',
    });
    console.log('✅ Firebase user created:', user.uid);
    console.log('   Email:', user.email);
    console.log('   UID:', user.uid);
    return user;
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      console.log('ℹ️ User already exists, fetching...');
      const existing = await admin.auth().getUserByEmail('demo@sevasetu.app');
      console.log('   UID:', existing.uid);
      return existing;
    }
    throw err;
  }
}

createUser().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
