const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * @route   POST /api/ai/summarize-case
 * @desc    Summarize a legal case description using Gemini
 * @access  Private
 */
router.post('/summarize-case', auth, async (req, res) => {
    try {
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({ success: false, message: 'Case description is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(503).json({ success: false, message: 'Gemini AI service not configured' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      As a legal assistant for LegalAid Connect, provide a concise and professional summary of the following legal case description. 
      Identify the key legal categories, primary dispute, and any immediate actions needed.
      
      Case Description:
      "${description}"
      
      Format the response as a JSON object with:
      - summary: A brief 2-3 sentence overview
      - categories: An array of legal domains (e.g., Civil, Criminal, Property)
      - keyPoints: A few bullet points of the most critical facts
      - urgency: One of [Low, Medium, High]
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Attempt to parse JSON from the response (sometimes Gemini adds markdown code blocks)
        let aiData;
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : { text };
        } catch (e) {
            aiData = { text };
        }

        res.json({ success: true, data: aiData });
    } catch (error) {
        console.error('❌ AI Summarization Error:', error);
        res.status(500).json({ success: false, message: 'Failed to process case with AI', error: error.message });
    }
});

module.exports = router;
