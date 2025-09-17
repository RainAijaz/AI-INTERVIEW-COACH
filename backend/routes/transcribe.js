/**
 * transcribe.js
 * ------------
 * Handles /transcribe route.
 * - Receives audio, converts it, and transcribes with Whisper.
 * - Uses a single, powerful AI call to generate a comprehensive
 * evaluation of both verbal content and non-verbal cues.
 */

import express from "express";
import fs from "fs";
import path from "path";

// Correctly importing from your utils folder
import { ffmpegPath, whisperExe, modelBin, uploadsDir } from "../utils/paths.js";
import { cleanTranscription, runCommand } from "../utils/fileHelpers.js";

import { genAI } from "../config/apiClients.js";

const router = express.Router();

router.post("/", async (req, res) => {
  if (!req.files || !req.files.audio) return res.status(400).send("No audio uploaded");

  // Destructure all data from the request body
  const { questionText, domain, experience, postureData, emotionData } = req.body || {};
  const audioFile = req.files.audio;

  const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const webmPath = path.join(uploadsDir, `${uniqueId}-answer.webm`);
  const wavPath = webmPath.replace(/\.[^/.]+$/, ".wav");

  try {
    // --- 1. Save and Process Audio ---
    await audioFile.mv(webmPath);
    await runCommand(ffmpegPath, ["-y", "-i", webmPath, "-ar", "16000", "-ac", "1", "-acodec", "pcm_s16le", wavPath]);
    const whisperOutput = await runCommand(whisperExe, ["-f", wavPath, "-m", modelBin]);
    const cleanedText = cleanTranscription(whisperOutput);

    if (!cleanedText) {
      return res.json({ skipEvaluation: true, message: "No speech detected." });
    }

    // --- 2. Prepare Data for AI ---
    const parsedPostureData = postureData ? JSON.parse(postureData) : null;
    const parsedEmotionData = emotionData ? JSON.parse(emotionData) : null;

    // --- 3. Create the Single "Master Prompt" ---
    const masterPrompt = `
      You are "Echo," an elite AI interview and communication coach. Your primary function is to provide a complete, holistic evaluation by synthesizing all available data about a candidate's performance. Your tone must be encouraging, constructive, and highly professional.

      **INPUT DATA:**
      - **Interview Context:** The candidate is interviewing for a "${domain}" role at the "${experience}" level.
      - **Question Asked:** "${questionText}"
      - **Candidate's Spoken Answer (Transcript):** "${cleanedText}"
      - **Non-Verbal Data (Posture Summary):** ${JSON.stringify(parsedPostureData)}
      - **Non-Verbal Data (Emotion Summary):** ${JSON.stringify(parsedEmotionData)}

      **YOUR TASK:**
      Analyze all the input data above and respond ONLY with a single, valid JSON object. Do not include any markdown, introductory text, or explanations. The JSON object must have two top-level keys: "evaluation" and "holisticFeedback".

      {
        "evaluation": {
          "ratings": {
            "clarity": "Rate 1-5. How clear and structured was the answer?",
            "relevance": "Rate 1-5. How well did the answer address the specific question asked?",
            "completeness": "Rate 1-5. Did the answer have sufficient detail and examples for the candidate's experience level?"
          },
          "sentimentTone": "A concise analysis (1-2 sentences) of the answer's tone (e.g., confident, hesitant, enthusiastic) and its appropriateness.",
          "answerStrength": "A single, powerful sentence identifying the strongest part of the answer's content.",
          "howToMakeItBetter": [
            "An array of 2-3 specific, actionable tips to improve the content of the answer.",
            "Each tip should be a complete sentence."
          ],
          "suggestedBetterAnswer": "Rewrite the user's answer into an improved, well-structured example that incorporates the feedback."
        },
        "holisticFeedback": {
          "insight": "A concise paragraph (2-3 sentences) synthesizing the non-verbal cues (posture, emotion) with the content of the answer. For example, if they looked confident while discussing a failure, mention that.",
          "strength": "Based only on the non-verbal data, identify the single most positive behavior (e.g., 'Maintained an upright posture for 90% of the answer, projecting confidence.').",
          "improvement_tip": "Based only on the non-verbal data, provide the single most impactful tip for improvement (e.g., 'Try to smile briefly when mentioning a successful outcome to build more rapport.')."
        }
      }
    `;

    // --- 4. Make a Single AI Call ---
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    let result;
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        result = await model.generateContent(masterPrompt);
        break;
      } catch (err) {
        if (err.status === 503 && i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000;
          console.warn(`⚠️ Model overloaded. Retrying in ${delay / 1000}s...`);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw err;
        }
      }
    }

    // --- 5. Parse and Send the Final Response ---
    const rawResponseText = result.response.text().trim().replace(/```json|```/g, "");
    const aiFeedback = JSON.parse(rawResponseText);

    res.json({
      transcription: cleanedText,
      // Pass the raw data for the frontend charts
      postureAnalysis: { data: parsedPostureData },
      emotionAnalysis: { data: parsedEmotionData },
      // Pass the structured feedback from the single AI response
      evaluation: aiFeedback.evaluation,
      holisticFeedback: aiFeedback.holisticFeedback,
    });

  } catch (err) {
    console.error("Error in /transcribe route:", err);
    res.status(500).send(`Processing failed: ${err.message}`);
  } finally {
    // --- 6. Clean Temporary Files ---
    fs.unlink(webmPath, () => {});
    fs.unlink(wavPath, () => {});
  }
});

export default router;