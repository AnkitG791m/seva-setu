import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { suggestVolunteers } from '../lib/gemini.js';
import { scoreUrgency } from '../services/geminiService.js';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * POST /api/ai/analyse-urgency
 * Re-runs Gemini urgency analysis for a need report.
 */
router.post('/analyse-urgency', authenticate, async (req, res) => {
  const { needReportId } = req.body;

  try {
    const need = await prisma.needReport.findUnique({ where: { id: needReportId } });
    if (!need) return res.status(404).json({ error: 'Need report not found' });

    const hours_since_reported = Math.floor((new Date() - need.created_at) / (1000 * 60 * 60));
    
    const updated = await scoreUrgency({
      ...need,
      hours_since_reported,
      people_affected: need.people_affected || 1
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/suggest-volunteers
 * Returns AI-powered volunteer-matching recommendation.
 */
router.post('/suggest-volunteers', authenticate, async (req, res) => {
  const { needReportId } = req.body;

  try {
    const need = await prisma.needReport.findUnique({ where: { id: needReportId } });
    if (!need) return res.status(404).json({ error: 'Need report not found' });

    const volunteers = await prisma.volunteer.findMany({
      where: { is_available: true },
      include: { user: true },
    });

    const suggestion = await suggestVolunteers(need, volunteers);
    res.json({ suggestion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
