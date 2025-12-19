
import { GoogleGenAI } from "@google/genai";
import { Instruction } from "../types";

/**
 * Service to handle Gemini AI interactions.
 * Initialized lazily to prevent top-level 'process' ReferenceErrors.
 */
export const aiService = {
  /**
   * Generates a brief summary of pending instructions for the dashboard.
   */
  async getDashboardSummary(instructions: Instruction[]): Promise<string> {
    const pending = instructions.filter(i => i.status === 'Pending');
    if (pending.length === 0) return "All instructions are cleared. Excellent work!";

    const dataSubset = pending.map(i => ({
      ref: i.referenceNumber,
      cust: i.customerCode,
      loc: i.location,
      so: i.salesOrder,
      update: i.currentUpdate,
      comments: i.commentsSales
    }));

    try {
      // Fix: Always use the recommended initialization and model
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these pending special delivery instructions and provide a concise, professional executive summary (max 150 words). 
        Group them by urgency or common locations. Mention if any look particularly complex based on comments. 
        
        Data: ${JSON.stringify(dataSubset)}`,
        config: {
            systemInstruction: "You are a senior logistics coordinator assistant. Be professional, direct, and helpful."
        }
      });
      // Fix: Use .text property directly (not a method call)
      return response.text || "Could not generate summary at this time.";
    } catch (e) {
      console.error("AI Error:", e);
      return "The AI assistant is temporarily unavailable, but your pending instructions are safe.";
    }
  },

  /**
   * Polishes sales comments for clarity and professionalism using Gemini.
   */
  async polishComments(text: string): Promise<string> {
    if (!text || text.length < 5) return text;

    try {
      // Fix: Always use the recommended initialization and model
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Rewrite the following logistics comment to be clearer, more professional, and concise. Keep specific details like IDs or codes exactly as they are.
        
        Comment: "${text}"`,
        config: {
            systemInstruction: "You are an expert in industrial logistics communication. Improve the clarity of the text provided while maintaining all technical details."
        }
      });
      // Fix: Use .text property directly
      return response.text || text;
    } catch (e) {
      console.error("AI Error:", e);
      return text;
    }
  }
};
