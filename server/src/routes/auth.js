import { Router } from 'express';
import prisma from '../lib/prisma.js';
import admin from '../lib/firebase.js';

const router = Router();

/**
 * POST /api/auth/register
 * Called after Firebase sign-up to persist user in DB.
 */
router.post('/register', async (req, res) => {
  const { firebase_uid, name, email, phone, role } = req.body;

  if (!firebase_uid) {
    return res.status(400).json({ error: 'firebase_uid is required' });
  }

  try {
    // Verify the token actually belongs to this firebase_uid
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' });
    }
    const decoded = await admin.auth().verifyIdToken(authHeader.split(' ')[1]);
    if (decoded.uid !== firebase_uid) {
      return res.status(403).json({ error: 'Token UID mismatch' });
    }

    const existing = await prisma.user.findUnique({ where: { firebase_uid } });
    if (existing) return res.json(existing);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        firebase_uid,
        role: role ?? 'VOLUNTEER',
      },
    });

    // If registering as VOLUNTEER, create the volunteer profile
    if (user.role === 'VOLUNTEER') {
      await prisma.volunteer.create({
        data: { userId: user.id, skills: [], preferred_zones: [] },
      });
    }

    return res.status(201).json(user);
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/me
 * Returns DB user from Firebase token.
 */
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.split(' ')[1]);
    const user = await prisma.user.findUnique({
      where: { firebase_uid: decoded.uid },
      include: { volunteer: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
