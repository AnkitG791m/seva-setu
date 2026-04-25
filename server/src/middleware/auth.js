import admin from '../lib/firebase.js';
import prisma from '../lib/prisma.js';

/**
 * Verify Firebase ID token and attach the DB user to req.user.
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const isBypass = process.env.BYPASS_AUTH === 'true' || authHeader === 'Bearer dummy_token';

  if (!authHeader?.startsWith('Bearer ') && !isBypass) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader?.split(' ')[1];

  try {
    if (isBypass) {
      // In bypass mode, find any user or create a dummy one
      let user = await prisma.user.findFirst({
        where: { role: 'COORDINATOR' }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            name: 'Admin (Dummy)',
            email: 'admin@sevasetu.dummy',
            role: 'COORDINATOR',
            firebase_uid: 'dummy_uid_123'
          }
        });
      }

      req.user = user;
      req.firebaseUser = { uid: user.firebase_uid, email: user.email };
      return next();
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const user = await prisma.user.findUnique({
      where: { firebase_uid: decoded.uid },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    req.user = user;
    req.firebaseUser = decoded;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Restrict access to certain roles.
 * @param {...string} roles
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (process.env.BYPASS_AUTH === 'true') return next();
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
