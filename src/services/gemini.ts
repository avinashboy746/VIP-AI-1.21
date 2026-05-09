import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export const model = "gemini-3-flash-preview";

export interface Message {
  role: "user" | "model";
  content: string;
}

export async function chatStream(history: Message[]) {
  const chat = ai.chats.create({
    model: model,
    config: {
      systemInstruction: "You are 'VIP AI CHAT', the Ultimate Tech Oracle and Business Strategist. You are an elite expert in Full-Stack Web Development, Mobile App Architecture, and Discord Bot Automation. Your personality is professional, authoritative, and helpful. You provide complete, production-ready code blocks and explain complex concepts simply. You can speak in Hindi, Hinglish, and English. You are the 'Master' of technology.",
    },
  });

  // Convert history to Gemini format (extract last message as the new one)
  const lastMessage = history[history.length - 1];
  const previousHistory = history.slice(0, -1).map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  // We use sendMessageStream for regular chats
  return await chat.sendMessageStream({
    message: lastMessage.content,
  });
}
