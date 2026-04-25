import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import dotenv from 'dotenv';

// Use same alias strategy safely based on previous dependencies
import * as googleGenAi from '@google/generative-ai';

dotenv.config();

const router = Router();
const genAI = new (googleGenAi.GoogleGenerativeAI || googleGenAi.default.GoogleGenerativeAI)(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

router.get('/monthly-summary', authenticate, async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // 1. Prisma Queries
    const totalReports = await prisma.needReport.count({
      where: { created_at: { gte: startOfMonth } }
    });

    const statusCountsRaw = await prisma.needReport.groupBy({
      by: ['status'],
      _count: true,
      where: { created_at: { gte: startOfMonth } }
    });
    
    let resolved = 0;
    let pending = 0;
    statusCountsRaw.forEach(item => {
      if (item.status === 'RESOLVED') resolved = item._count;
      if (item.status === 'OPEN' || item.status === 'ASSIGNED') pending += item._count;
    });

    const activeVolunteers = await prisma.volunteer.count({
      where: { is_available: true } 
    });

    const completedTasks = await prisma.task.findMany({
      where: { status: 'COMPLETED', completed_at: { gte: startOfMonth } },
      include: { needReport: true }
    });
    
    // Total people helped
    const peopleHelped = completedTasks.reduce((sum, task) => sum + (task.needReport?.people_affected || 1), 0);

    // Category aggregation
    const categoryCountsRaw = await prisma.needReport.groupBy({
      by: ['category'],
      _count: true,
      where: { created_at: { gte: startOfMonth } }
    });
    const reportsByCategory = categoryCountsRaw.reduce((acc, curr) => ({
      ...acc, [curr.category]: curr._count
    }), {});

    // Top volunteer
    const topVolunteers = await prisma.volunteer.findMany({
      orderBy: { avg_rating: 'desc' },
      take: 1,
      include: { user: true }
    });
    const topVolunteer = topVolunteers[0]?.user?.name || 'Community Hero';

    // Avg resolution time
    let totalHrs = 0;
    completedTasks.forEach(t => {
      if (t.completed_at && t.needReport.created_at) {
        const diffMs = new Date(t.completed_at) - new Date(t.needReport.created_at);
        totalHrs += (diffMs / (1000 * 60 * 60));
      }
    });
    const avgResolutionHours = completedTasks.length > 0 ? (totalHrs / completedTasks.length).toFixed(1) : 0;

    const stats = {
      total_reports: totalReports,
      resolved_vs_pending: { resolved, pending },
      active_volunteers: activeVolunteers,
      total_people_helped: peopleHelped,
      reports_by_category: reportsByCategory,
      top_performing_volunteer: topVolunteer,
      avg_resolution_hours: avgResolutionHours
    };

    // 2. Gemini Narrative (optional — falls back gracefully)
    let narrative = `इस महीने SevaSetu ने ${stats.total_reports} जरूरतें दर्ज कीं और ${stats.total_people_helped} लोगों की मदद की। ${stats.active_volunteers} स्वयंसेवक सक्रिय रहे।\n\nThis month, SevaSetu recorded ${stats.total_reports} need reports. Our ${stats.active_volunteers} active volunteers worked tirelessly to help ${stats.total_people_helped} people in need.\n\nTop performing volunteer: ${stats.top_performing_volunteer}. We continue to focus on areas needing more attention and urge more community members to join.`;
    let generated_by = 'Fallback (Gemini unavailable)';

    try {
      const prompt = `Write a short 3-paragraph impact report in simple Hindi + English 
for an NGO monthly newsletter. Tone: warm, grateful, inspiring.
Data: ${JSON.stringify(stats)}
Include: what was achieved, who helped most, what needs more attention.`;
      const result = await model.generateContent(prompt);
      narrative = result.response.text();
      generated_by = 'Gemini 1.5 Flash';
    } catch (geminiErr) {
      console.warn('Gemini unavailable, using fallback narrative:', geminiErr.message);
    }

    res.json({ stats, narrative, generated_by });

  } catch (err) {
    console.error('Monthly summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
