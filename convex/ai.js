"use node";
// The Gemini SDK needs Node APIs, same reason convex/stripeActions.js opts
// into the Node runtime.

import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { action } from "./_generated/server";

// Keep this in sync with the `id`s in lib/expense-categories.js — duplicated
// here (as plain strings) so this file doesn't have to import a
// lucide-react-heavy module into a server action just for a list of ids.
const CATEGORY_IDS = [
  "foodDrink", "coffee", "groceries", "shopping", "travel", "transportation",
  "housing", "entertainment", "tickets", "utilities", "water", "education",
  "health", "personal", "gifts", "technology", "bills", "baby", "music",
  "books", "other", "general",
];

const PROMPT = `
You are an expense-parsing assistant for a bill-splitting app. You'll be given a short natural-language description of an expense, a photo of a receipt, or both.

Respond with ONLY a raw JSON object — no markdown fences, no commentary — shaped exactly like this:
{
  "description": string,        // short expense title, e.g. "Dinner at Taj Restaurant"
  "amount": number | null,      // total amount as a plain number, no currency symbol. null if you can't tell.
  "category": string,           // exactly one of: ${CATEGORY_IDS.join(", ")}
  "date": string | null,        // ISO date "YYYY-MM-DD" if mentioned or printed on the receipt, else null
  "merchant": string | null,    // store/restaurant name if identifiable, else null
  "participantNames": string[]  // first names/nicknames of people mentioned as splitting this, EXCLUDING "me"/"I"/"myself". Empty array if none mentioned.
}

Rules:
- If a receipt image is provided, read the printed total, merchant name, and date directly from it rather than guessing.
- If both a description and an image are given, prefer the receipt's printed numbers but use the description for participant names.
- If you cannot confidently determine the amount, set "amount" to null rather than estimating.
- "category" must be one of the exact ids listed above — pick "other" if nothing fits well.
`.trim();

function safeParseJson(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export const parseExpenseInput = action({
  args: {
    text: v.optional(v.string()),
    imageBase64: v.optional(v.string()),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.text?.trim() && !args.imageBase64) {
      throw new Error("Type a description or attach a receipt photo first");
    }
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "Gemini isn't configured yet — set GEMINI_API_KEY with `npx convex env set GEMINI_API_KEY ...`"
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const parts = [{ text: PROMPT }];
    if (args.text?.trim()) {
      parts.push({ text: `User's description: """${args.text.trim()}"""` });
    }
    if (args.imageBase64) {
      parts.push({
        inlineData: {
          data: args.imageBase64,
          mimeType: args.mimeType || "image/jpeg",
        },
      });
      parts.push({ text: "The image above is a photo of a receipt." });
    }

    const result = await model.generateContent(parts);
    const raw = result.response.text();

    let parsed;
    try {
      parsed = safeParseJson(raw);
    } catch {
      throw new Error(
        "Couldn't read that clearly — try rephrasing, or a clearer photo"
      );
    }

    const amount =
      typeof parsed.amount === "number" && parsed.amount > 0
        ? parsed.amount
        : null;
    const date =
      typeof parsed.date === "string" && !isNaN(Date.parse(parsed.date))
        ? parsed.date
        : null;

    return {
      description:
        typeof parsed.description === "string"
          ? parsed.description.slice(0, 120)
          : "",
      amount,
      category: CATEGORY_IDS.includes(parsed.category)
        ? parsed.category
        : "other",
      date,
      merchant: typeof parsed.merchant === "string" ? parsed.merchant : null,
      participantNames: Array.isArray(parsed.participantNames)
        ? parsed.participantNames.filter((n) => typeof n === "string").slice(0, 10)
        : [],
    };
  },
});
