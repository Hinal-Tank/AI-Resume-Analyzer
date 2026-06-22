import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload size limit to accommodate large base64-encoded PDF files
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper function to lazy-initialize the Gemini client safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add your key to the Secrets panel in Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Ensure database/AI configuration isn't missing
app.get("/api/health", (req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: "ok",
    hasApiKey: hasKey,
    environment: process.env.NODE_ENV || "development",
  });
});

/**
 * 1. RESUME ANALYZER ENDPOINT
 * Analyzes static text OR direct PDF base64 using the server-side Gemini API
 */
app.post("/api/analyze-resume", async (req: Request, res: Response) => {
  try {
    const { pdfBase64, filename, textFallback } = req.body;
    
    if (!pdfBase64 && !textFallback) {
      res.status(400).json({ error: "Empty request. Please upload a PDF resume or enter/paste your resume text." });
      return;
    }

    const ai = getGeminiClient();
    
    let contents: any[] = [];
    let systemInstruction = `You are an elite, hyper-accurate Applicant Tracking System (ATS) auditor and career counselor.
Analyze the provided resume document and produce a rigorous JSON analysis report.
Be extremely objective and fair:
1. Candidate Info: Extract candidate name, email, and phone. Default to "Unknown Name" or "N/A" if missing.
2. ATS Score (0-100): Score based on standard industry keyword match, format consistency, readability, skills distribution, and clear experience impact metrics.
3. Technical Skills: Extract high-value, hard engineering/technical/design skills.
4. Soft Skills: Extract communication, collaboration, leadership, and emotional intelligence skills.
5. Strengths: Detail 4-5 high-impact bulleted statements regarding experience levels, formatting, or project metrics.
6. Weaknesses: Highlight 3-4 constructive weaknesses (e.g. lack of quantified outcomes, missing key industry qualifications).
7. Missing Skills: Identify skills commonly found in counterparts with similar titles but missing contextually.
8. Recommendations: Provide strict, sequential, highly actionable steps to boost the ATS score score significantly.`;

    if (pdfBase64) {
      // Strip base64 prefixes if present (e.g., data:application/pdf;base64,)
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
      contents.push({
        inlineData: {
          mimeType: "application/pdf",
          data: cleanBase64
        }
      });
      contents.push({
        text: `Attached is a PDF resume filename: ${filename || "resume.pdf"}. Execute a complete ATS audit and career assessment.`
      });
    } else {
      contents.push({
        text: `Here is the pasted text of the candidate's resume:\n\n${textFallback}\n\nExecute a complete ATS audit and career assessment.`
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidateName: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            atsScore: { type: Type.INTEGER },
            technicalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: [
            "candidateName", "email", "phone", "atsScore",
            "technicalSkills", "softSkills", "strengths", "weaknesses",
            "missingSkills", "recommendations"
          ]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response output from the resume analysis model.");
    }

    const parsedResult = JSON.parse(resultText.trim());
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: error?.message || "Failed to parse and analyze the resume." });
  }
});

/**
 * 2. JOB DESCRIPTION MATCH ENDPOINT
 * Compares the resume content against a specified Job Description
 */
app.post("/api/jd-match", async (req: Request, res: Response) => {
  try {
    const { resumeText, jdText } = req.body;
    if (!resumeText || !jdText) {
      res.status(400).json({ error: "Both resume text/skills and a job description are required for comparison." });
      return;
    }

    const ai = getGeminiClient();
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Compare the candidate's Resume/Skills details against the Job Description.

Candidate Resume details/text:
${typeof resumeText === 'string' ? resumeText : JSON.stringify(resumeText)}

Target Job Description:
${jdText}`
        }
      ],
      config: {
        systemInstruction: `You are an expert recruitment manager. Audit the correspondence between the candidate's qualification detail and the target job description. Generate:
- A match percentage (0 to 100). Be realistic and metric-based.
- Strong matches (skills or tools present in both).
- Missing skills or alignment gaps (highly targeted tools, stacks, or capabilities required by the job description but omitted from the resume).
- Precise, concrete suggestions of how to refine the resume layout/bullets to better match this specific job.
- Keywords found from the job description in the resume.
- An optimized executive summary / professional objective designed specifically for this job description utilizing key relevant search terms.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchPercentage: { type: Type.INTEGER },
            strongMatches: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywordsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
            optimizedObjective: { type: Type.STRING }
          },
          required: [
            "matchPercentage", "strongMatches", "missingSkills", 
            "improvementSuggestions", "keywordsFound", "optimizedObjective"
          ]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response output from the Job Description match model.");
    }

    const parsedResult = JSON.parse(resultText.trim());
    res.json(parsedResult);
  } catch (error: any) {
    console.error("JD Match Error:", error);
    res.status(500).json({ error: error?.message || "Failed to compare resume vs job description." });
  }
});

/**
 * 3. INTERVIEW QUESTIONS GENERATOR
 * Generates custom interview questions (10 tech, 5 HR, 5 project-based) dynamically matched with skills
 */
app.post("/api/generate-questions", async (req: Request, res: Response) => {
  try {
    const { skills, candidateProfile } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Generate 20 tailored interview questions based on this profile:
Skills List: ${JSON.stringify(skills || [])}
Profile Context: ${candidateProfile || "Software Engineer / Professional"}

Requirements:
- Prepare exactly 10 Technical Questions (focused on candidate's technical skills, methodologies, design patterns, coding logic)
- Prepare exactly 5 HR/Behavioral Questions (focused on teamwork, leadership, failure analysis, conflict resolution)
- Prepare exactly 5 Project-Based Questions (exploring high-risk situations, tradeoffs, production architectural design, scalability)
- Provide a rich 'sampleAnswer' outline for each containing bulleted lists of key points the interviewer is looking for.`
        }
      ],
      config: {
        systemInstruction: "You are a senior hiring director and principal examiner. Create a comprehensive, realistic interview schedule of 20 highly-relatable and deep questions. Ensure the difficulty spans Beginner, Intermediate, and Advanced tiers.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique auto-generated ID (e.g. q-1, q-2)" },
                  question: { type: Type.STRING, description: "Detailed, realistic questions" },
                  type: { type: Type.STRING, description: "Must be 'technical', 'hr', or 'project'" },
                  difficulty: { type: Type.STRING, description: "Must be 'Beginner', 'Intermediate', or 'Advanced'" },
                  sampleAnswer: { type: Type.STRING, description: "A summary outline of points and terminology the absolute ideal response should hit" }
                },
                required: ["id", "question", "type", "difficulty", "sampleAnswer"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response output from the Question Gen model.");
    }

    const parsedResult = JSON.parse(resultText.trim());
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Question Generation Error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate practice interview questions." });
  }
});

/**
 * 4. INTERVIEW INTERACTIVE EVALUATION
 * Grades the user's interactive typed/spoken answers to interview questions in real-time
 */
app.post("/api/evaluate-answer", async (req: Request, res: Response) => {
  try {
    const { question, sampleAnswer, userResponse } = req.body;
    if (!question || !userResponse) {
      res.status(400).json({ error: "Both the question and your response are required to perform feedback assessment." });
      return;
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Evaluate this interview answer:
Question: "${question}"
Reference Ideal Points: "${sampleAnswer}"
User Answer: "${userResponse}"`
        }
      ],
      config: {
        systemInstruction: `You are an executive mock-interview coach. Analyze the user's response critically but constructively.
Rate the answer overall on a scale of 0 to 100.
Assign a rating descriptor (e.g., "Outstanding", "Strong Effort", "Satisfactory", "Needs Structural Improvement", "Incomplete").
Provide a concise critique describing what went well, what industry frameworks they could reference (like STAR method, CAR method, SOLID code, etc.), and what information is missing.
Identify 3-4 specific bulleted keywords or concepts they MUST state to reach maximum marks.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Numeric grade score from 0 to 100" },
            rating: { type: Type.STRING, description: "Short overall rating word" },
            critique: { type: Type.STRING, description: "Helpful performance evaluation" },
            suggestedPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific technical details, buzzwords, or structured methodologies they left out or should articulate better" }
          },
          required: ["score", "rating", "critique", "suggestedPoints"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No feedback output from the evaluator model.");
    }

    const parsedResult = JSON.parse(resultText.trim());
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Evaluation Error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate evaluation feedback." });
  }
});

// START EXPRESS SERVER WITH VITE INTEGRATION
async function startServer() {
  // Vite Integration for HMR and serving front-end bundle
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Resume Analyzer app server booted on http://localhost:${PORT}`);
  });
}

// Handle global rejection errors gracefully
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

startServer();
