import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

/** GET /api/users — COORDINATOR only */
router.get('/', authenticate, authorize('COORDINATOR'), async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { volunteer: true },
      orderBy: { created_at: 'desc' },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/users/:id */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { volunteer: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/users/:id */
router.patch('/:id', authenticate, async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'COORDINATOR') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { name, phone, role } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, phone, role },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/users/:id — COORDINATOR only */
router.delete('/:id', authenticate, authorize('COORDINATOR'), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
