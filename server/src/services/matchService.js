// Invalid import removed: import { GoogleGenerativeAI } from '@google-generative-ai';
import prisma from '../lib/prisma.js';
import dotenv from 'dotenv';
dotenv.config();

// Fix up the import if it's the wrong package depending on earlier resolutions
// Node standard is @google/generative-ai currently.
import * as googleGenAi from '@google/generative-ai';
const genAI = new (googleGenAi.GoogleGenerativeAI || googleGenAi.default.GoogleGenerativeAI)(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Radius of earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function matchVolunteers(needReport) {
  // Step 1 - Basic filter from DB: is_available = true
  const volunteers = await prisma.volunteer.findMany({
    where: { is_available: true },
    include: { user: true }
  });

  const nearbyVolunteers = [];

  for (const vol of volunteers) {
    let distanceKm = null;
    
    // Calculate distance only if user has recorded their geo setup
    if (vol.lat != null && vol.lng != null) {
      distanceKm = getDistanceFromLatLonInKm(needReport.lat, needReport.lng, vol.lat, vol.lng);
    }

    // Filter: Only volunteers within 15km (or allow those missing lat/long for demo purposes cautiously)
    if (distanceKm === null || distanceKm <= 15) {
      nearbyVolunteers.push({
        volunteer_id: vol.id,
        name: vol.user?.name || 'Unknown',
        skills: vol.skills,
        distance_km: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : 0, 
        avg_rating: vol.avg_rating,
        zones: vol.preferred_zones
      });
    }
  }

  if (nearbyVolunteers.length === 0) {
    return { error: 'No volunteers available within 15km' };
  }

  // Step 2 - Gemini smart ranking
  const prompt = `You are matching volunteers to a community need in India.

Need Details:
- Category: ${needReport.category}
- Description: ${needReport.description}  
- Location: ${needReport.location}
- Urgency: ${needReport.urgency_score}/100
- People Affected: ${needReport.people_affected || 1}

Available Volunteers (JSON):
${JSON.stringify(nearbyVolunteers, null, 2)}

Rank these volunteers best to worst for this task.
Consider: skill relevance, proximity, past rating.
Return ONLY JSON array:
[{ "volunteer_id": "string", "rank": number, "match_score": number, "reason_hindi": "string" }]`;

  try {
    const result = await model.generateContent(prompt);
    // Strip markdown format wrappers sometimes output by Gemini
    const rawText = result.response.text();
    const cleanText = rawText.replace(/```(?:json)?/g, '').trim();
    
    const rankedData = JSON.parse(cleanText);

    // Step 3 - Merge Gemini ranking with DB data
    const topMatches = rankedData.slice(0, 3).map(geminiResult => {
      const dbVol = nearbyVolunteers.find(v => v.volunteer_id === geminiResult.volunteer_id);
      return {
        ...dbVol,
        rank: geminiResult.rank,
        match_score: geminiResult.match_score,
        reason_hindi: geminiResult.reason_hindi
      };
    });

    return { matches: topMatches };
  } catch (error) {
    console.error("Gemini matching failed:", error.message);
    return { error: "Failed to process smart match via Gemini API" };
  }
}
