import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Priority } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const taskBreakdownSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    refinedTitle: {
      type: Type.STRING,
      description: "A clear, concise title for the main task.",
    },
    priority: {
      type: Type.STRING,
      enum: [Priority.LOW, Priority.MEDIUM, Priority.HIGH],
      description: "The suggested priority level based on urgency or complexity.",
    },
    subtasks: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "A list of 3-5 actionable subtasks to complete the main goal.",
    },
  },
  required: ["refinedTitle", "priority", "subtasks"],
};

export const breakdownTaskWithAI = async (userInput: string): Promise<{ refinedTitle: string, priority: Priority, subtasks: string[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `The user wants to do the following task: "${userInput}". 
      Please analyze this request.
      1. Refine the title to be more actionable.
      2. Assign a logical priority (Low, Medium, High).
      3. Break it down into small, concrete steps (max 5).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: taskBreakdownSchema,
        systemInstruction: "You are a helpful productivity assistant. Your goal is to make vague tasks actionable.",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(text);
    return {
        refinedTitle: data.refinedTitle,
        priority: data.priority as Priority,
        subtasks: data.subtasks || []
    };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Fallback if AI fails
    return {
      refinedTitle: userInput,
      priority: Priority.MEDIUM,
      subtasks: []
    };
  }
};