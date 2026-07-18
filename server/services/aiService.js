import ApiError from "../utils/apiError.js";

const getGeminiApiKey = () => {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
};

const callGemini = async (prompt) => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return null; // Fallback to mock if API key is not present
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API call failed status:", response.status, errText);
      if (response.status === 429) {
        return "QUOTA_EXHAUSTED";
      }
      return null;
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply || null;
  } catch (error) {
    console.error("Gemini call error:", error.message);
    return null;
  }
};

export const translateText = async (text, targetLanguage) => {
  if (!text || !targetLanguage) {
    throw new ApiError(400, "Text and target language are required.");
  }

  const prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translation, nothing else:\n\n"${text}"`;
  const geminiResponse = await callGemini(prompt);

  if (geminiResponse === "QUOTA_EXHAUSTED") {
    return "AI service temporarily unavailable. The free Gemini API quota has been exhausted. Please try again later.";
  }

  if (geminiResponse) {
    return geminiResponse.trim();
  }

  // Fallback translation helper
  const lang = targetLanguage.toLowerCase();
  if (lang.includes("spanish")) {
    return `[ES] ${text} (Transl.: Hola! Esto es una traducción simulada en español.)`;
  } else if (lang.includes("french")) {
    return `[FR] ${text} (Transl.: Salut! C'est une traduction simulée en français.)`;
  } else if (lang.includes("german")) {
    return `[DE] ${text} (Transl.: Hallo! Dies ist eine simulierte Übersetzung ins Deutsche.)`;
  } else if (lang.includes("hindi")) {
    return `[HI] ${text} (Transl.: नमस्ते! यह हिंदी में अनुवाद है।)`;
  }
  return `[Translated to ${targetLanguage}]: ${text}`;
};

export const summarizeChat = async (messages) => {
  if (!messages || messages.length === 0) {
    return "No messages to summarize.";
  }

  const chatTranscript = messages
    .map((m) => `${m.senderName || m.senderId}: ${m.text || "[Media/Image]"}`)
    .join("\n");

  const prompt = `Summarize the following chat conversation into a concise bulleted list highlighting key discussion points and conclusions:\n\n${chatTranscript}`;
  const geminiResponse = await callGemini(prompt);

  if (geminiResponse === "QUOTA_EXHAUSTED") {
    return "Summary unavailable. The free Gemini API quota has been exhausted. Please try again later.";
  }

  if (geminiResponse) {
    return geminiResponse;
  }

  // Mock Fallback Summary
  return `### Chat Summary (Demo Mode)
- **Activity**: ${messages.length} messages analyzed.
- **Key participants**: Active conversation between users.
- **Media**: Image/attachment transfers were detected.
- **Tone**: Friendly and operational.
*(Configure GEMINI_API_KEY in server/.env for live AI summaries)*`;
};

export const getSmartReplies = async (lastMessageText) => {
  if (!lastMessageText) {
    return ["Hey there!", "Hello!", "How can I help you?"];
  }

  const prompt = `Based on the following last message received in a chat, suggest exactly 3 short, natural-sounding, contextual quick-reply options for the user. Return ONLY a JSON array of strings, for example: ["Option 1", "Option 2", "Option 3"]:\n\n"${lastMessageText}"`;
  const geminiResponse = await callGemini(prompt);

  if (geminiResponse === "QUOTA_EXHAUSTED") {
    return [];
  }

  if (geminiResponse) {
    try {
      // Find JSON block if Gemini outputs extra text
      const cleanJson = geminiResponse.substring(
        geminiResponse.indexOf("["),
        geminiResponse.lastIndexOf("]") + 1
      );
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) return parsed.slice(0, 3);
    } catch {
      // JSON parse failed, split by lines/quotes
    }
  }

  // Fallback Smart Replies
  const text = lastMessageText.toLowerCase();
  if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
    return ["Hey, what's up?", "Hello! How are you?", "Hi there! 👋"];
  } else if (text.includes("how are you") || text.includes("how's it going")) {
    return ["I'm doing great, thanks!", "Not bad, how about you?", "Pretty good! 😊"];
  } else if (text.includes("bye") || text.includes("goodbye") || text.includes("see you")) {
    return ["Goodbye! Talk later.", "See ya!", "Bye! Take care."];
  } else if (text.includes("thank") || text.includes("thanks")) {
    return ["You're welcome!", "Anytime!", "My pleasure! 👍"];
  }
  return ["Sure, sounds good!", "Okay, got it.", "Awesome! Let me check."];
};

export const askAiAssistant = async (prompt, chatHistory = []) => {
  if (!prompt) {
    throw new ApiError(400, "Prompt is required.");
  }

  const historyContext = chatHistory
    .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
    .join("\n");

  const fullPrompt = `${historyContext}\nSystem: You are Connectify AI, a premium chat assistant integrated inside the Connectify app. Respond concisely and professionally to the user's query.\nUser: ${prompt}\nAssistant:`;

  const geminiResponse = await callGemini(fullPrompt);

  if (geminiResponse === "QUOTA_EXHAUSTED") {
    return "AI service temporarily unavailable. The free Gemini API quota has been exhausted. Please try again later.";
  }

  if (geminiResponse) {
    return geminiResponse;
  }

  // Mock Fallback Assistant Response
  const query = prompt.toLowerCase();
  if (query.includes("features") || query.includes("what can you do")) {
    return "I am Connectify AI! I can summarize chats, translate messages into different languages, suggest auto-replies, and answer your questions directly in the chat panel. Give it a try!";
  } else if (query.includes("help")) {
    return "Sure, I can help! Let me know if you want to write a code snippet, compose a professional message, or learn more about Connectify.";
  }
  return `Hi! I am the Connectify AI assistant. 
You asked: "${prompt}"
To enable live AI answers, please configure \`GEMINI_API_KEY\` in your server \`.env\` file. How else can I assist you today?`;
};
