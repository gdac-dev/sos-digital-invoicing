import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { sendAdminNotificationEmail } from '../utils/email.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, lang = 'fr', userEmail } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ 
        reply: lang === 'fr' 
          ? "L'assistant IA est actuellement désactivé. Veuillez configurer la clé API Gemini." 
          : "AI Assistant is currently disabled. Please configure the Gemini API key."
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemPrompt = `
You are the SOS DIGITAL Assistant, an intelligent chatbot for an invoicing and commercial management web application.
Your goal is to help users understand how to use the app and provide excellent support.
You must answer in the user's language: ${lang === 'fr' ? 'French' : 'English'}.
Be polite, concise, and professional. Use markdown for formatting (bold, italic).

App features include:
- Invoices: Create, edit, export to PDF (Classic, Modern, Minimalist, Elegant templates), add watermarks/stamps, track payments, send via WhatsApp.
- Quotes: Create and convert them to invoices with one click.
- Clients: CRM to manage clients.
- Catalog: Manage predefined services/items.
- Reports: Annual summaries, monthly breakdowns, export to CSV.
- Settings: Admins can manage users (Sales, Accounting roles).

CRITICAL RULE:
If the user asks to speak to a human, contact the administrator, or if you cannot help them, you MUST include the exact string "[CONTACT_ADMIN]" somewhere in your response. 
If you include "[CONTACT_ADMIN]", also tell the user that the administrator has been notified and will contact them shortly.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    let reply = response.text || '';

    // Check if AI decided to contact admin
    if (reply.includes('[CONTACT_ADMIN]')) {
      reply = reply.replace(/\[CONTACT_ADMIN\]/g, '').trim();
      
      // Send email to admin asynchronously
      sendAdminNotificationEmail(userEmail || 'Non renseigné', message).catch(err => {
        console.error('Failed to send admin notification:', err);
      });
    }

    res.json({ reply });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Erreur serveur du chatbot' });
  }
});

export default router;
