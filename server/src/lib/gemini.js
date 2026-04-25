import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyse a need report and return an urgency score + reason using Gemini.
 * @param {{ title: string, description: string, category: string, location: string }} report
 * @returns {Promise<{ score: number, reason: string }>}
 */
export async function analyseUrgency(report) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are an emergency triage assistant for a humanitarian volunteer platform called SevaSetu.
Analyse the following need report and return a JSON object with:
  - "score": an urgency score from 1 (low) to 10 (critical)
  - "reason": a concise 1-2 sentence explanation for the score

Need Report:
  Title: ${report.title}
  Category: ${report.category}
  Location: ${report.location}
  Description: ${report.description}

Return ONLY valid JSON, no markdown fences.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    const parsed = JSON.parse(text);
    return {
      score: Math.min(10, Math.max(1, Math.round(parsed.score))),
      reason: parsed.reason ?? '',
    };
  } catch {
    // Fallback if Gemini returns unexpected format
    return { score: 5, reason: text };
  }
}

/**
 * Match available volunteers to a need report using Gemini.
 * @param {object} needReport
 * @param {Array<object>} volunteers
 * @returns {Promise<string>}
 */
export async function suggestVolunteers(needReport, volunteers) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are a volunteer coordinator for SevaSetu, a humanitarian platform.
Given the need report and the list of available volunteers, suggest the top 3 best-matched volunteers and explain why.

Need Report:
${JSON.stringify(needReport, null, 2)}

Available Volunteers:
${JSON.stringify(volunteers, null, 2)}

Return a short, actionable recommendation. Mention volunteer names and their matching skills.
`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export default genAI;
