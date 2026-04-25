import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/** POST /api/feedback — submit feedback for a completed task */
router.post('/', authenticate, async (req, res) => {
  const { taskId, rating, comment } = req.body;

  if (!taskId || rating == null) {
    return res.status(400).json({ error: 'taskId and rating are required' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { feedback: true },
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Feedback can only be submitted for completed tasks' });
    }
    if (task.feedback) {
      return res.status(400).json({ error: 'Feedback already submitted for this task' });
    }

    const feedback = await prisma.feedback.create({
      data: { taskId, rating: parseInt(rating), comment },
    });

    // Update volunteer's average rating
    const allFeedbacks = await prisma.feedback.findMany({
      where: { task: { volunteerId: task.volunteerId } },
    });
    const avgRating =
      allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length;

    await prisma.volunteer.update({
      where: { id: task.volunteerId },
      data: { avg_rating: parseFloat(avgRating.toFixed(2)) },
    });

    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/feedback/:taskId */
router.get('/:taskId', authenticate, async (req, res) => {
  try {
    const feedback = await prisma.feedback.findUnique({
      where: { taskId: req.params.taskId },
    });
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
