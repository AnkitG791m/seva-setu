import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { scoreUrgency } from '../services/geminiService.js';

const router = Router();

/** GET /api/needs — list all need reports (with optional filters) */
router.get('/', authenticate, async (req, res) => {
  const { status, category, urgency } = req.query;

  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;

  try {
    const needs = await prisma.needReport.findMany({
      where,
      include: { tasks: { include: { volunteer: { include: { user: true } } } } },
      orderBy: urgency === 'desc'
        ? { urgency_score: 'desc' }
        : { created_at: 'desc' },
    });
    res.json(needs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/needs/:id */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const need = await prisma.needReport.findUnique({
      where: { id: req.params.id },
      include: {
        tasks: {
          include: {
            volunteer: { include: { user: true } },
            feedback: true,
          },
        },
      },
    });
    if (!need) return res.status(404).json({ error: 'Need report not found' });
    res.json(need);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/needs — create a need report (COORDINATOR or FIELD_WORKER) */
router.post(
  '/',
  authenticate,
  authorize('COORDINATOR', 'FIELD_WORKER'),
  async (req, res) => {
    const { title, description, category, location, lat, lng, photo_url } = req.body;

    if (!title || !description || !category || !location || lat == null || lng == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // 1. Create the basic NeedReport without score first
      const need = await prisma.needReport.create({
        data: {
          title,
          description,
          category,
          location,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          photo_url,
        },
      });

      // 2. Pass it to the Gemini service which updates the DB
      const updatedNeed = await scoreUrgency({
        ...need,
        people_affected: req.body.people_affected || 1,
        hours_since_reported: 0
      });

      res.status(201).json(updatedNeed);
    } catch (err) {
      console.error('Create need error:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

/** PATCH /api/needs/:id */
router.patch('/:id', authenticate, authorize('COORDINATOR', 'FIELD_WORKER'), async (req, res) => {
  const { title, description, category, location, lat, lng, status, photo_url } = req.body;

  try {
    const need = await prisma.needReport.update({
      where: { id: req.params.id },
      data: {
        title, description, category, location,
        lat: lat != null ? parseFloat(lat) : undefined,
        lng: lng != null ? parseFloat(lng) : undefined,
        status, photo_url,
      },
    });
    res.json(need);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/needs/:id — COORDINATOR only */
router.delete('/:id', authenticate, authorize('COORDINATOR'), async (req, res) => {
  try {
    await prisma.needReport.delete({ where: { id: req.params.id } });
    res.json({ message: 'Need report deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
