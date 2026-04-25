import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

/** GET /api/volunteers — list all volunteers */
router.get('/', authenticate, async (req, res) => {
  const { available, zone } = req.query;

  const where = {};
  if (available === 'true') where.is_available = true;
  if (zone) where.preferred_zones = { has: zone };

  try {
    const volunteers = await prisma.volunteer.findMany({
      where,
      include: { user: true },
      orderBy: { avg_rating: 'desc' },
    });
    res.json(volunteers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/volunteers/:id */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const volunteer = await prisma.volunteer.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        tasks: {
          include: {
            needReport: true,
            feedback: true,
          },
          orderBy: { assigned_at: 'desc' },
        },
      },
    });
    if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });
    res.json(volunteer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/volunteers/fcm-token — update FCM token */
router.patch('/fcm-token', authenticate, async (req, res) => {
  const { fcm_token } = req.body;
  if (!fcm_token) return res.status(400).json({ error: 'fcm_token is required' });

  try {
    const volunteer = await prisma.volunteer.findUnique({ where: { userId: req.user.id } });
    if (!volunteer) return res.status(404).json({ error: 'Volunteer profile not found' });

    const updated = await prisma.volunteer.update({
      where: { id: volunteer.id },
      data: { fcm_token },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/volunteers/:id — update profile (the volunteer themselves or COORDINATOR) */
router.patch('/:id', authenticate, async (req, res) => {
  const { skills, preferred_zones, is_available } = req.body;

  try {
    // Ensure only the owner or a coordinator can update
    const volunteer = await prisma.volunteer.findUnique({ where: { id: req.params.id } });
    if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });

    if (volunteer.userId !== req.user.id && req.user.role !== 'COORDINATOR') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.volunteer.update({
      where: { id: req.params.id },
      data: { skills, preferred_zones, is_available },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
