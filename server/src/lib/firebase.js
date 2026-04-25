import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('🔥 Firebase Admin initialized');
  } catch (err) {
    if (process.env.BYPASS_AUTH === 'true') {
      console.warn('⚠️ Firebase Admin initialization failed, continuing in BYPASS mode');
    } else {
      throw err;
    }
  }
}

export default admin;
