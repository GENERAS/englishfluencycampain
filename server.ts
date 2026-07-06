import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";

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
    const { promptText, audioUrl, transcript } = req.body;

    if (!promptText) {
      return res.status(400).json({ error: "promptText is required" });
    }

    const ai = getGeminiClient();

    const contents: any[] = [];
    let promptContent = `Please analyze this speaking practice submission for the topic: "${promptText}". `;

    if (transcript) {
      promptContent += `The student's live speech transcript recorded via Web Speech API was: "${transcript}". Please evaluate grammar, vocabulary, and sentence construction against this transcript. `;
    }

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
Your prompts, examples, and scoring criteria are strictly aligned with the Rwanda Education Board (REB) syllabus guidelines, with themes covering local environmental conservation (Akagera), eco-tourism, and technological innovation (Kigali Innovation City).

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
  "overallFeedback": string, // a comprehensive encouraging summary paragraph of the speaking submission with concrete next steps
  "voiceprintAnomalyDetected": boolean // set to true ONLY if there are sudden robotic patterns, unnatural phonetic spikes, or dramatic shifts from a student's normal human speech indicating potential use of an AI voice generator or distinct-person voice cloning.
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
            overallFeedback: { type: Type.STRING },
            voiceprintAnomalyDetected: { type: Type.BOOLEAN }
          },
          required: ["fluency", "pronunciation", "vocabulary", "grammar", "overallFeedback", "voiceprintAnomalyDetected"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini API");
    }

    const feedbackData = JSON.parse(text);
    if (feedbackData.voiceprintAnomalyDetected) {
      console.log(`[FLAG: VOICEPRINT_ANOMALY_DETECTED] Suspicious speaking style or robotic audio generated for student prompt: "${promptText}"`);
    }
    return res.json(feedbackData);
  } catch (err: any) {
    console.error("Speaking analysis endpoint error:", err);
    return res.status(500).json({ error: err.message || "Failed to analyze speaking" });
  }
});

// AI Admin/Teacher Helper: Evaluate Essay Writing
app.post("/api/admin/evaluate-writing", async (req, res) => {
  try {
    const { title, content, type } = req.body;

    if (!content) {
      return res.status(400).json({ error: "content is required" });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a professional English language examiner and mentor. You evaluate student essay or letter writing submissions.
Your prompts, examples, and scoring criteria are aligned with the Rwanda Education Board (REB) syllabus guidelines, with themes covering local environmental conservation (Akagera), eco-tourism, and technological innovation (Kigali Innovation City).

Your task is to provide realistic assessment grades (0 to 25 points per section) and professional mentor feedback.
You must return a response in strict JSON format that matches the following structure:
{
  "grammar": number, // score between 0 and 25 (integer)
  "vocabulary": number, // score between 0 and 25 (integer)
  "structure": number, // score between 0 and 25 (integer)
  "clarity": number, // score between 0 and 25 (integer)
  "feedback": string, // a detailed, supportive, constructive feedback summary paragraph that explains the rating and provides concrete advice for improvement
  "plagiarismSuspected": boolean // set to true ONLY if there are sudden, unnatural spikes in vocabulary, copy-pasted internet prose, or excessively flawless adult phrasing that deviates from intermediate student capability baselines.
}
The feedback should be human-like, encouraging, and highly specific to the content. Do not output anything other than valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Please evaluate this student submission of type "${type || "essay"}" with title "${title || "Untitled"}":\n\n"${content}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grammar: { type: Type.INTEGER },
            vocabulary: { type: Type.INTEGER },
            structure: { type: Type.INTEGER },
            clarity: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
            plagiarismSuspected: { type: Type.BOOLEAN }
          },
          required: ["grammar", "vocabulary", "structure", "clarity", "feedback", "plagiarismSuspected"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini API");
    }

    const evaluation = JSON.parse(text);
    if (evaluation.plagiarismSuspected) {
      console.log(`[FLAG: PLAGIARISM_SUSPECTED] Unnatural vocabulary spike or copied text detected for student writing: "${title || "Untitled"}"`);
    }
    return res.json(evaluation);
  } catch (err: any) {
    console.error("Writing evaluation helper error:", err);
    return res.status(500).json({ error: err.message || "Failed to evaluate writing submission" });
  }
});

// AI Admin/Teacher Helper: Evaluate Speaking Practice
app.post("/api/admin/evaluate-speaking", async (req, res) => {
  try {
    const { promptText, audioUrl } = req.body;

    if (!promptText) {
      return res.status(400).json({ error: "promptText is required" });
    }

    const ai = getGeminiClient();

    const contents: any[] = [];
    let speakContext = `Please assess this speaking practice on topic "${promptText}". `;

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
        speakContext += "Evaluate pronunciation, vocal fluency, grammatical flow, and word choice directly from the audio.";
      } catch (err) {
        console.warn("Could not parse base64 speaking audio for admin help, falling back", err);
        speakContext += "Estimate quality based on topic and generate highly constructive guidance.";
      }
    } else {
      speakContext += "Estimate quality based on topic and generate highly constructive guidance.";
    }

    contents.push({ text: speakContext });

    const systemInstruction = `You are a professional IELTS or TOEFL speaking examiner. You assess student voice recordings.
Your prompts, examples, and scoring criteria are aligned with the Rwanda Education Board (REB) syllabus guidelines, with themes covering local environmental conservation (Akagera), eco-tourism, and technological innovation (Kigali Innovation City).

Your task is to analyze the pronunciation, vocal fluency, vocabulary, and grammar, and suggest a score of 0 to 25 points for each category.
You must return a response in strict JSON format matching this structure:
{
  "pronunciation": number, // score between 0 and 25 (integer)
  "fluency": number, // score between 0 and 25 (integer)
  "vocabulary": number, // score between 0 and 25 (integer)
  "grammar": number, // score between 0 and 25 (integer)
  "feedback": string, // a detailed, encouraging, IELTS-style assessor feedback paragraph advising on pronunciation improvement, tempo, flow, and vocab choice
  "voiceprintAnomalyDetected": boolean // set to true ONLY if there are robotic fluctuations, speech synthesis, or sudden shifts in voice timbre or style.
}
Do not output anything other than valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pronunciation: { type: Type.INTEGER },
            fluency: { type: Type.INTEGER },
            vocabulary: { type: Type.INTEGER },
            grammar: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
            voiceprintAnomalyDetected: { type: Type.BOOLEAN }
          },
          required: ["pronunciation", "fluency", "vocabulary", "grammar", "feedback", "voiceprintAnomalyDetected"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini API");
    }

    const evaluation = JSON.parse(text);
    if (evaluation.voiceprintAnomalyDetected) {
      console.log(`[FLAG: VOICEPRINT_ANOMALY_DETECTED] Suspicious student vocal or robotic timbre detected on topic: "${promptText}"`);
    }
    return res.json(evaluation);
  } catch (err: any) {
    console.error("Speaking evaluation helper error:", err);
    return res.status(500).json({ error: err.message || "Failed to evaluate speaking submission" });
  }
});

// Dynamic AI Language Challenge Generator for Mastery Tracker
app.post("/api/language-tracker/generate-challenge", async (req, res) => {
  try {
    const { path: challengePath, currentLevel } = req.body;

    if (!challengePath) {
      return res.status(400).json({ error: "path is required ('global' | 'regional' | 'register')" });
    }

    const ai = getGeminiClient();

    let targetFocus = "";
    if (challengePath === "global") {
      targetFocus = `CEFR Level ${currentLevel || "B2"} Grammar, syntax, collocations, inversion, or vocabulary nuance. Progressively challenge the user with academic structures suitable for this level.`;
    } else if (challengePath === "regional") {
      targetFocus = `Regional varieties (American English, British English, Australian English). Focus on spelling/vocabulary shifts (e.g., lift vs elevator, colour vs color, bonnet vs hood, flat vs apartment).`;
    } else if (challengePath === "register") {
      targetFocus = `Strategic Register switching. Focus on Formal, Informal, Business, or Technical English nuances (e.g., campaign outreach tone, formal business emails, casual volunteer slang).`;
    }

    const systemInstruction = `You are an expert English Language Professor and IELTS/CEFR Examiner.
Your task is to generate an educational, highly engaging, and contextual multiple-choice English challenge.
The challenge must directly target: ${targetFocus}

You must return a response in strict JSON format matching this exact structure:
{
  "question": string, // The clear scenario, task, or question stem (e.g. "Select the word that completes the British English sentence: 'I need to put my bags in the ____ before driving.'")
  "options": [string, string, string, string], // Exactly 4 distinct multiple-choice options
  "correctOptionIdx": number, // The 0-based index of the correct option (integer 0 to 3)
  "explanation": string, // A helpful, professional, encouraging explanation of why the correct option is right and why others are incorrect
  "varietyInfo": string // Light context about the CEFR rule, regional usage, or register nuance being tested
}
Do not output anything other than valid JSON. Make the question highly relevant to professional development, communication, or volunteer campaigns where possible.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a multiple choice challenge for the path "${challengePath}" with current level indicator "${currentLevel || "intermediate"}".`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctOptionIdx: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            varietyInfo: { type: Type.STRING }
          },
          required: ["question", "options", "correctOptionIdx", "explanation", "varietyInfo"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini API");
    }

    const challenge = JSON.parse(text);
    return res.json(challenge);
  } catch (err: any) {
    console.error("Language challenge generator error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate language challenge" });
  }
});

// Interactive Admin AI Assistant (Co-Copilot Engine) API Route
app.post("/api/admin/copilot", async (req, res) => {
  try {
    const { messages, viewport, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are the ADMINISTRATIVE AI COPILOT & DATA ARCHITECT embedded inside our Rwandan educational campaign's Admin Dashboard. Your primary role is to act as an on-demand data analyst, report generator, and automation assistant for our platform administrators. You handle natural language database queries, summarize complex cheating investigations, and execute bulk administrative tasks.

Every response you generate MUST STRICTLY align with the administrator's active viewport device context to maintain perfect fluid responsiveness.

1. CONVERSATIONAL DISPLAY RULES BY DEVICE BREAKPOINT:
The current user's viewport is: "${viewport || "desktop"}"

[IF USER VIEWPORT IS "mobile"]:
- Transform your response into a single-column, hyper-compact vertical feed.
- Enforce extreme word economy: write in ultra-short sentences UNDER 10 WORDS.
- Use simple, fragment-based bullet points.
- Never output wide tables, charts, or long paragraphs that force sideways scrolling.
- Place immediate action buttons or confirmation triggers at the very top of the text block (e.g., **[ACTION: AUDIT REPORT]** or **[TRIGGER: BULK VERIFICATION]**).

[IF USER VIEWPORT IS "tablet"]:
- Structure your response for a slide-over modal window.
- Organize complex data into clean, two-part horizontal pairings (e.g., **Key Label**: Value Description) using bold anchors.
- Use horizontal divider lines (---) to cleanly separate distinct analysis points, telemetry records, or student profiles.

[IF USER VIEWPORT IS "desktop"]:
- Populate a dedicated right-side sticky panel (25% viewport width).
- You are free to use multi-layered Markdown blocks, code snippets, structured JSON schemas, and extensive summaries.
- Break up large operational data sets using organized tables with flexible, percentage-based column widths.

2. CORE ASSISTANT CAPABILITIES & COMMAND WORKFLOWS:
You must process and execute these core administrative workflows:
- Natural Language Query Processing: Translate simple admin questions into structured data filters (e.g., "Show me all high-risk accounts in Gasabo district" -> compile a list of profiles where District = Gasabo and Risk Score > 75%).
- Automated Bulk Actions: Process multi-record requests safely (e.g., "Approve all pending audio logs from GS Gisenyi with zero flags" -> output a structured verification confirmation list).
- Case Escalation Summaries: Synthesize multiple anti-cheat flags (written plagiarism, voiceprint fraud, device/IP conflicts) into a high-density, 3-bullet brief outlining exactly why a student account is being flagged or restricted.

3. SCAN-OPTIMIZED COMMUNICATIONS:
- Every single response MUST start with a direct, upfront answer, verdict, or structural data summary in the first sentence.
- Use bold typography (**key data indicators**) as visual anchors to allow rapid reading under 5 seconds.
- Align all educational, geographical, and institutional terms with Rwanda Education Board (REB) naming conventions (e.g., Districts: Gasabo, Kicukiro, Nyarugenge, Rubavu, Musanze, Gicumbi, etc.; Sectors; School Names like GS Gisenyi, GS Kacyiru; Campaign Points).

4. DESIGN CONFLICTS RESOLUTION:
If a data payload or table is too large for the current screen width, automatically drop secondary columns and convert the core text into a stacked vertical layout. Readability and viewport fit on small screens always take priority over structural complexity.`;

    // Stringify current viewport context to inject into prompt for immediate state awareness
    const contextString = `
[CURRENT VIEWPORT CONTEXT]
Active Tab: ${context?.activeTab || "Unknown"}
Selected Writing ID: ${context?.selectedWriting?.id || "None"}
Selected Writing Title: "${context?.selectedWriting?.title || "None"}"
Selected Writing Content: "${context?.selectedWriting?.content || "None"}"
Selected Writing User Name: "${context?.selectedWriting?.userName || "None"}"
Selected Speaking ID: ${context?.selectedSpeaking?.id || "None"}
Selected Speaking Prompt: "${context?.selectedSpeaking?.promptText || "None"}"
Selected Speaking User Name: "${context?.selectedSpeaking?.userName || "None"}"

[CURRENT REGISTERED USERS COUNT]
Total Users: ${context?.usersCount || 0}
[SAFETY QUEUE PENDING ITEMS]
Total Flagged Reports: ${context?.reportsCount || 0}
`;

    const lastMessage = messages[messages.length - 1];
    const history = messages.slice(0, messages.length - 1).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const fullUserPrompt = `${contextString}\n\nUser Query: ${lastMessage.content}`;

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
        temperature: 0.7,
      },
      history: history
    });

    const response = await chat.sendMessage({
      message: fullUserPrompt
    });

    const text = response.text;
    return res.json({ text });
  } catch (err: any) {
    console.error("Admin copilot error:", err);
    return res.status(500).json({ error: err.message || "Failed to process copilot query" });
  }
});

// AI PRACTICE COACH / COGNITIVE COIL ANTI-CHEAT HELPER
app.post("/api/practice/coach", async (req, res) => {
  try {
    const { question, promptText, submissionType } = req.body;
    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are the Practice Arena AI Coach for EFC Rwanda.
Your goal is to help students learn English vocabulary, understand complex words, grammar, and expressions.
However, you MUST pay attention to CHEATING! 
If a student asks you to write their submission, translate their full answer, or generate a complete speech/writing template for their active prompt ("${promptText || 'N/A'}"), you MUST flag it.

Analyze if the student is trying to cheat (i.e. bypass practicing the task themselves).
Return a JSON object with this exact structure:
{
  "isCheatingDetected": boolean, // true if they ask you to write the text, translate their direct answer, or bypass their active task
  "coachResponse": string, // A helpful, positive explanation, or if they tried to cheat, a friendly reminder to practice themselves and an educational hint instead
  "challengeQuestion": string // If they tried to cheat, a quick interactive verification or vocabulary question to challenge them (e.g. "To verify your focus, can you use the word 'conserve' in a short sentence?"). If no cheating, keep this empty.
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Student is working on a ${submissionType || 'speaking/writing'} task. 
Prompt: "${promptText || 'N/A'}"
Student asks: "${question}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCheatingDetected: { type: Type.BOOLEAN },
            coachResponse: { type: Type.STRING },
            challengeQuestion: { type: Type.STRING }
          },
          required: ["isCheatingDetected", "coachResponse", "challengeQuestion"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return res.json(result);
  } catch (err: any) {
    console.error("Practice coach API error:", err);
    return res.status(500).json({ error: err.message || "Failed to query AI coach" });
  }
});

// AI PRACTICE COACH VERIFY CHALLENGE ENDPOINT
app.post("/api/practice/verify-challenge", async (req, res) => {
  try {
    const { challenge, answer } = req.body;
    if (!challenge) {
      return res.status(400).json({ error: "challenge is required" });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are EFC Rwanda's Anti-Cheat Proctor.
The student was given this interactive verification challenge to prove they are paying attention and not cheating: "${challenge}".
They answered: "${answer || ''}".
Decide if their response is a reasonable, genuine attempt that solves the challenge (e.g., if they were asked to use a word in a sentence, did they do it reasonably?).
Return a JSON object with this exact structure:
{
  "isApproved": boolean, // true if the response is a correct or genuine attempt, false if it's nonsense, blank, or an attempt to bypass
  "feedback": string // A supportive, brief confirmation or a message explaining why they need to try again
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Challenge: "${challenge}"
Student Answer: "${answer || ''}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isApproved: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING }
          },
          required: ["isApproved", "feedback"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return res.json(result);
  } catch (err: any) {
    console.error("Verify challenge error:", err);
    return res.status(500).json({ error: err.message || "Failed to verify challenge" });
  }
});

// AI LISTENING PRACTICE LESSON GENERATOR
app.post("/api/listening/generate-questions", async (req, res) => {
  try {
    const { youtubeUrl, audioUrl, topicOrDescription } = req.body;
    console.log("[generate-questions] Request received with body:", { youtubeUrl, audioUrl, topicOrDescription });
    if (!youtubeUrl && !audioUrl) {
      console.warn("[generate-questions] Missing media source (youtubeUrl or audioUrl)");
      return res.status(400).json({ error: "Either youtubeUrl or audioUrl is required" });
    }

    const ai = getGeminiClient();
    const mediaSource = youtubeUrl ? `YouTube Video: "${youtubeUrl}"` : `Uploaded Podcast Audio file: "${audioUrl}"`;
    const systemInstruction = `You are an AI Curriculum Designer for EFC Rwanda. 
Prepare a high-quality listening practice lesson based on the provided video/podcast description or topic: "${topicOrDescription || 'General English listening podcast'}".
The media is sourced from: ${mediaSource}.
Choose if students should answer by "writing" an essay/summary or by "speaking" their answers (depending on what makes the lesson most effective).
Create 3 specific, deep listening comprehension questions based on the topic.

Return a JSON object with this exact structure:
{
  "title": string, // Catchy, relevant title (e.g., "Eco-Tourism in Akagera: Wildlife Recovery")
  "instructions": string, // Detailed instructions on what to listen for (e.g., "Watch the documentary or listen to the podcast on Rwanda's conservation success. Pay attention to how community incentives reduced poaching.")
  "questionText": string, // The numbered questions students must answer after watching/listening
  "submissionType": string // MUST be either "writing" or "speaking"
}`;

    console.log("[generate-questions] Call Gemini API using gemini-3.5-flash...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Create a listening lesson for: "${topicOrDescription || 'General English podcast'}". Sourced from: ${mediaSource}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            instructions: { type: Type.STRING },
            questionText: { type: Type.STRING },
            submissionType: { type: Type.STRING }
          },
          required: ["title", "instructions", "questionText", "submissionType"]
        }
      }
    });

    console.log("[generate-questions] Gemini API response text:", response.text);
    const result = JSON.parse(response.text || "{}");
    console.log("[generate-questions] Parsed JSON result successfully:", result);
    return res.json(result);
  } catch (err: any) {
    console.error("[generate-questions] Error occurred in API:", err);
    return res.status(500).json({ error: err.message || "Failed to generate listening lesson" });
  }
});

// AI GENERATE FULL PODCAST WITH AUDIO AND QUESTIONS
app.post("/api/listening/generate-podcast", async (req, res) => {
  try {
    const { topic, difficulty, voiceName } = req.body;
    console.log("[generate-podcast] Request received with body:", { topic, difficulty, voiceName });
    if (!topic) {
      console.warn("[generate-podcast] Missing topic parameter");
      return res.status(400).json({ error: "topic is required" });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are an expert English language curriculum designer for EFC Rwanda.
Prepare a high-quality educational listening podcast script and comprehension questions for English learners at the "${difficulty || 'Intermediate'}" CEFR level.
The podcast topic or theme is: "${topic}".
Design the podcast script to be an engaging monolog or speech (approx. 100-200 words long) written in highly authentic, clean English suitable for the specified CEFR level.
Choose if students should answer by "writing" an essay/summary or by "speaking" their answers (depending on what makes the lesson most effective).
Create 3 specific, deep listening comprehension questions based on the script.

Return a JSON object with this exact structure:
{
  "title": string, // Catchy, relevant title (e.g., "The Coffee Farmers of Huye")
  "script": string, // The full spoken monologue script for the podcast. This will be read out loud by AI. Keep it under 250 words.
  "instructions": string, // Detailed instructions on what students should listen for
  "questionText": string, // The numbered questions students must answer after listening (e.g. "1. ... \n2. ... \n3. ...")
  "submissionType": string // MUST be either "writing" or "speaking"
}`;

    console.log("[generate-podcast] Call Gemini API generateContent using gemini-3.5-flash for text script & questions...");
    const textResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a full listening lesson and script for topic: "${topic}" at level: "${difficulty || 'Intermediate'}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            script: { type: Type.STRING },
            instructions: { type: Type.STRING },
            questionText: { type: Type.STRING },
            submissionType: { type: Type.STRING }
          },
          required: ["title", "script", "instructions", "questionText", "submissionType"]
        }
      }
    });

    console.log("[generate-podcast] Gemini text response text:", textResponse.text);
    const result = JSON.parse(textResponse.text || "{}");
    const scriptText = result.script || "";

    if (!scriptText) {
      console.error("[generate-podcast] Failed to generate script. Result was:", result);
      throw new Error("Failed to generate a script for the podcast.");
    }

    // Now, call gemini-3.1-flash-tts-preview to turn this script into speech audio
    console.log("[generate-podcast] Generating audio for script using gemini-3.1-flash-tts-preview with prebuiltVoice:", voiceName || "Zephyr");
    let audioBase64 = "";
    try {
      const selectedVoice = voiceName || "Zephyr"; // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say with clarity, pacing nicely for English learners: ${scriptText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      console.log("[generate-podcast] TTS Response received, analyzing...");
      const base64Data = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Data) {
        audioBase64 = `data:audio/mp3;base64,${base64Data}`;
        console.log("[generate-podcast] TTS audio Base64 generated successfully. Length:", audioBase64.length);
      } else {
        console.warn("[generate-podcast] TTS Response had no inline data parts:", ttsResponse.candidates?.[0]?.content?.parts);
      }
    } catch (ttsErr: any) {
      console.error("[generate-podcast] TTS generation failed, but script was generated successfully:", ttsErr);
    }

    return res.json({
      ...result,
      audioBase64
    });
  } catch (err: any) {
    console.error("[generate-podcast] Podcast generation API error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate podcast" });
  }
});

// AI LISTENING SUBMISSION GRADING/REVIEWER
app.post("/api/listening/review", async (req, res) => {
  try {
    const { practiceTitle, questionText, submissionType, textResponse, transcript, audioUrl } = req.body;

    const ai = getGeminiClient();
    const systemInstruction = `You are an expert English language examiner reviewing a Listening comprehension submission for the lesson: "${practiceTitle}".
Questions asked: "${questionText}".
Submission type: "${submissionType}".
Evaluate how well the student listened and responded to the questions. Give actionable, supportive coaching feedback on grammar, comprehension, and vocabulary.

Return a JSON object with this exact structure:
{
  "score": number, // out of 100, provide a fair grade
  "aiReview": string // Detailed feedback paragraph. Explicitly highlight strong points and areas where they can improve their listening comprehension or English grammar.
}`;

    let studentWork = textResponse || "";
    if (submissionType === "speaking" && transcript) {
      studentWork = `Speaking Transcript: ${transcript}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Student response: "${studentWork}"
Questions: "${questionText}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            aiReview: { type: Type.STRING }
          },
          required: ["score", "aiReview"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return res.json(result);
  } catch (err: any) {
    console.error("Listening review API error:", err);
    return res.status(500).json({ error: err.message || "Failed to analyze listening submission" });
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
