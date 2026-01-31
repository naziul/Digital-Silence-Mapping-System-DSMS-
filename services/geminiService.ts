
import { GoogleGenAI, Type } from "@google/genai";
import { NoiseRecord, AIInsight } from "../types";

export const getUrbanInsights = async (records: NoiseRecord[]): Promise<AIInsight> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const noiseSummary = records.map(r => 
    `Lat: ${r.latitude}, Lng: ${r.longitude}, dB: ${r.decibels}`
  ).join('\n');

  const prompt = `
    Act as a professional Urban Planner and Environmental Scientist.
    Analyze the following noise pollution data collected in a city:
    
    ${noiseSummary}

    Identify patterns, suggest high-risk noise zones, and provide 3 actionable urban planning recommendations to create 'Silence Corridors' or improve public health.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A summary of the noise situation." },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of 3 urban planning recommendations."
            },
            urbanPlanningScore: { 
              type: Type.NUMBER, 
              description: "A score from 0-100 indicating urban acoustic health."
            }
          },
          required: ["summary", "recommendations", "urbanPlanningScore"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return {
      summary: "Unable to generate AI insights at this moment.",
      recommendations: ["Ensure regular monitoring", "Promote green belts", "Enforce noise limits"],
      urbanPlanningScore: 50
    };
  }
};
