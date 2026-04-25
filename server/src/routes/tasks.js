import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { matchVolunteers } from '../services/matchService.js';
import { sendTaskNotification } from '../services/fcmService.js';

const router = Router();

/** GET /api/tasks — list tasks (filtered by volunteer if not coordinator) */
router.get('/', authenticate, async (req, res) => {
  const { status } = req.query;

  let where = {};
  if (status) where.status = status;

  // Volunteers can only see their own tasks
  if (req.user.role === 'VOLUNTEER') {
    const volunteer = await prisma.volunteer.findUnique({ where: { userId: req.user.id } });
    if (volunteer) where.volunteerId = volunteer.id;
  }

  try {
    const tasks = await prisma.task.findMany({
      where,
      include: {
        needReport: true,
        volunteer: { include: { user: true } },
        feedback: true,
      },
      orderBy: { assigned_at: 'desc' },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/tasks/:id */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        needReport: true,
        volunteer: { include: { user: true } },
        feedback: true,
      },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/tasks/assign — AI smart match & assign volunteer */
router.post('/assign', authenticate, authorize('COORDINATOR'), async (req, res) => {
  const { needReportId } = req.body;
  if (!needReportId) return res.status(400).json({ error: 'needReportId is required' });

  try {
    const report = await prisma.needReport.findUnique({ where: { id: needReportId } });
    if (!report) return res.status(404).json({ error: 'Need report not found' });

    // Step 1 & 2 - Filter and Rank
    const matchResult = await matchVolunteers(report);
    if (matchResult.error) return res.status(400).json({ error: matchResult.error });

    const bestMatch = matchResult.matches[0];
    if (!bestMatch) return res.status(400).json({ error: 'No volunteers available to match' });

    // Step 3 - Assign DB records
    const task = await prisma.task.create({
      data: { needReportId, volunteerId: bestMatch.volunteer_id, status: 'PENDING' },
      include: { needReport: true, volunteer: { include: { user: true } } },
    });

    await prisma.needReport.update({ where: { id: needReportId }, data: { status: 'ASSIGNED' } });
    await prisma.volunteer.update({ where: { id: bestMatch.volunteer_id }, data: { is_available: false } });

    // Send actual FCM using the DB token
    const volRecord = await prisma.volunteer.findUnique({ where: { id: bestMatch.volunteer_id } });
    if (volRecord && volRecord.fcm_token) {
      await sendTaskNotification(volRecord.fcm_token, task, report);
    }

    res.status(201).json({
      task,
      assignment_details: {
        match_score: bestMatch.match_score,
        reason_hindi: bestMatch.reason_hindi,
        top_matches: matchResult.matches
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/tasks — manually assign a volunteer to a need (COORDINATOR only) */
router.post('/', authenticate, authorize('COORDINATOR'), async (req, res) => {
  const { needReportId, volunteerId } = req.body;

  if (!needReportId || !volunteerId) {
    return res.status(400).json({ error: 'needReportId and volunteerId are required' });
  }

  try {
    const task = await prisma.task.create({
      data: { needReportId, volunteerId, status: 'PENDING' },
      include: { needReport: true, volunteer: { include: { user: true } } },
    });

    // Mark need as ASSIGNED
    await prisma.needReport.update({
      where: { id: needReportId },
      data: { status: 'ASSIGNED' },
    });

    // Mark volunteer as unavailable
    await prisma.volunteer.update({
      where: { id: volunteerId },
      data: { is_available: false },
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/tasks/:id/status — volunteer accepts or completes */
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['ACCEPTED', 'COMPLETED'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(', ')}` });
  }

  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const updateData = { status };
    if (status === 'COMPLETED') updateData.completed_at = new Date();

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: { needReport: true, volunteer: { include: { user: true } } },
    });

    // If completed, resolve the need and free the volunteer
    if (status === 'COMPLETED') {
      await prisma.needReport.update({
        where: { id: task.needReportId },
        data: { status: 'RESOLVED' },
      });
      await prisma.volunteer.update({
        where: { id: task.volunteerId },
        data: { is_available: true },
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
