import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from '../lib/prisma.js';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function scoreUrgency(report) {
  try {
    const prompt = `You are an expert NGO coordinator in India. Analyze this community need report and rate its urgency from 0 to 100.

Rules:
- Medical emergencies = 80-100
- Water/sanitation crisis = 60-80  
- Food insecurity = 50-70
- Shelter issues = 40-60
- Education/other = 20-40
- More people affected = higher score
- Report older than 24hrs = add 10 points

Report Data:
Title: ${report.title}
Category: ${report.category}
Description: ${report.description}
People Affected: ${report.people_affected || 1}
Hours Since Reported: ${report.hours_since_reported || 0}

Respond ONLY in this JSON format:
{
  "score": number,
  "reason": "string (1 line in Hindi)",
  "priority_label": "CRITICAL | HIGH | MEDIUM | LOW"
}`;

    const result = await model.generateContent(prompt);
    // Remove markdown code blocks if the model outputs them
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);

    // Update NeedReport in DB
    const updatedReport = await prisma.needReport.update({
      where: { id: report.id },
      data: {
        urgency_score: Math.min(100, Math.max(0, Number(parsed.score))),
        gemini_reason: parsed.reason,
        priority_label: parsed.priority_label
      }
    });

    return updatedReport;
  } catch (error) {
    console.error("Gemini failed, using rule-based fallback:", error.message);
    
    // Fallback scoring
    let score = 30; // default
    const cat = report.category?.toLowerCase() || '';
    if (cat.includes('medical')) score = 90;
    else if (cat.includes('water')) score = 70;
    else if (cat.includes('food')) score = 60;
    else if (cat.includes('shelter')) score = 50;

    // Apply modifiers manually
    if ((report.people_affected || 1) > 10) score += 10;
    if ((report.hours_since_reported || 0) > 24) score += 10;
    
    // Cap at 100
    score = Math.min(100, score);

    let priority_label = "LOW";
    if (score >= 80) priority_label = "CRITICAL";
    else if (score >= 60) priority_label = "HIGH";
    else if (score >= 40) priority_label = "MEDIUM";

    const reason = "तकनीकी समस्या के कारण स्वतः मूल्यांकन किया गया।"; // "Automatically evaluated due to technical issue."

    const updatedReport = await prisma.needReport.update({
      where: { id: report.id },
      data: {
        urgency_score: score,
        gemini_reason: reason,
        priority_label: priority_label
      }
    });

    return updatedReport;
  }
}
