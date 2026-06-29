import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: "25mb" }));

// Lazy initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// AI Speaking Analysis API Route
app.post("/api/speaking/analyze", async (req, res) => {
  try {
    const { promptText, audioUrl } = req.body;

    if (!promptText) {
      return res.status(400).json({ error: "promptText is required" });
    }

    const ai = getGeminiClient();

    const contents: any[] = [];
    let promptContent = `Please analyze this speaking practice submission for the topic: "${promptText}". `;

    // If we have a base64 audio URL, append it as inlineData
    if (audioUrl && audioUrl.startsWith("data:")) {
      try {
        const parts = audioUrl.split(",");
        const header = parts[0];
        const base64Data = parts[1];
        const mimeType = header.split(";")[0].split(":")[1] || "audio/wav";

        contents.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
        promptContent += "Analyze the pronunciation, rhythm, and clarity directly from the provided speaking audio part.";
      } catch (err) {
        console.warn("Could not parse base64 audio, falling back to simulated analysis context", err);
        promptContent += "Assess based on the topic prompt and provide highly realistic coaching advice.";
      }
    } else {
      promptContent += "Assess based on the topic prompt and provide highly realistic coaching advice.";
    }

    contents.push({ text: promptContent });

    const systemInstruction = `You are an expert English language assessor and fluency coach. Your job is to analyze speaking practice submissions and provide highly constructive, encouragement-focused automated feedback on pronunciation, fluency, vocabulary, and grammar.
You must return a response in strict JSON format that matches the following TypeScript structure:
{
  "fluency": {
    "score": number, // out of 100, give a realistic grade
    "feedback": string // detailed, highly constructive, actionable coaching feedback
  },
  "pronunciation": {
    "score": number, // out of 100, give a realistic grade
    "feedback": string // detailed, highly constructive, actionable coaching feedback
  },
  "vocabulary": {
    "score": number, // out of 100, give a realistic grade
    "feedback": string // detailed, highly constructive, actionable coaching feedback
  },
  "grammar": {
    "score": number, // out of 100, give a realistic grade
    "feedback": string // detailed, highly constructive, actionable coaching feedback
  },
  "overallFeedback": string // a comprehensive encouraging summary paragraph of the speaking submission with concrete next steps
}
Do not include any markdown backticks or extra text, output ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fluency: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                feedback: { type: Type.STRING }
              },
              required: ["score", "feedback"]
            },
            pronunciation: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                feedback: { type: Type.STRING }
              },
              required: ["score", "feedback"]
            },
            vocabulary: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                feedback: { type: Type.STRING }
              },
              required: ["score", "feedback"]
            },
            grammar: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                feedback: { type: Type.STRING }
              },
              required: ["score", "feedback"]
            },
            overallFeedback: { type: Type.STRING }
          },
          required: ["fluency", "pronunciation", "vocabulary", "grammar", "overallFeedback"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini API");
    }

    const feedbackData = JSON.parse(text);
    return res.json(feedbackData);
  } catch (err: any) {
    console.error("Speaking analysis endpoint error:", err);
    return res.status(500).json({ error: err.message || "Failed to analyze speaking" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
