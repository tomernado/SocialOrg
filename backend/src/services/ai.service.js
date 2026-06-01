import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { env } from '../config/env.js';

// ---------------------------------------------------------------------------
// Gemini client — initialised once, shared across all calls
// ---------------------------------------------------------------------------
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// gemini-2.5-flash-lite: fastest free-tier model, ideal for high-throughput classification
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-lite-preview-06-17',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.1, // low temperature = deterministic, consistent categorisation
  },
});

// ---------------------------------------------------------------------------
// Zod schema — strict structured output guard (ai-rules.md § 7)
// LLM output is REJECTED if it does not match this schema exactly.
// ---------------------------------------------------------------------------
const articleLlmSchema = z.object({
  category: z.enum([
    'עולם ה-AI והפיתוח',
    'חדשות בעולם הספורט',
    'חדשות בעולם הכדורגל',
    'חדשות כלליות בעולם הבידור',
    'חדשות כלליות בעולם',
  ]),
  sub_category: z.string().min(1, 'sub_category must not be empty'),
  tag: z.string().min(1, 'tag must not be empty'),
  relevance_score: z.number().int().min(1).max(10),
  ai_summary: z.string().min(1, 'ai_summary must not be empty'),
});

// ---------------------------------------------------------------------------
// Prompt factory
// ---------------------------------------------------------------------------
function buildPrompt(title, content) {
  return `
אתה עורך חדשות מומחה בעברית. תפקידך לנתח כתבה ולהחזיר JSON בלבד, ללא טקסט נוסף.

כתבה לניתוח:
כותרת: ${title}
תוכן: ${(content ?? '').slice(0, 800)}

החזר אובייקט JSON בדיוק בפורמט הבא (ללא שדות נוספים):
{
  "category": "<אחד מהערכים הבאים בדיוק>",
  "sub_category": "<תת-קטגוריה ספציפית בעברית, למשל: ברצלונה, כלכלה, כדורסל>",
  "tag": "<האשטאג אחד רלוונטי בעברית, למשל: #העברות_שחקנים, #בינה_מלאכותית, #פוליטיקה>",
  "relevance_score": <מספר שלם בין 1 ל-10 המציין את הרלוונטיות>,
  "ai_summary": "<סיכום קצר של 1-2 משפטים בעברית>"
}

ערכי category המותרים (בחר בדיוק אחד):
- "עולם ה-AI והפיתוח"      ← טכנולוגיה, תוכנה, בינה מלאכותית, פיתוח
- "חדשות בעולם הספורט"    ← ספורט כללי (כדורסל, טניס, אתלטיקה וכו')
- "חדשות בעולם הכדורגל"   ← כדורגל בלבד
- "חדשות כלליות בעולם הבידור" ← קולנוע, מוזיקה, בידור, סלבריטאים
- "חדשות כלליות בעולם"    ← פוליטיקה, כלכלה, מדע, חדשות כלליות

חשוב: החזר JSON תקין בלבד. אל תוסיף markdown, הסברים או טקסט מחוץ ל-JSON.
`.trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sends an article to Gemini for Hebrew categorisation and summarisation.
 * Validates the response strictly against articleLlmSchema (ai-rules.md § 7).
 *
 * @param {string} title
 * @param {string|null|undefined} content
 * @returns {Promise<z.infer<typeof articleLlmSchema>>}
 * @throws {Error} if Gemini call fails or response fails Zod validation
 */
export async function categorizeArticle(title, content) {
  const prompt = buildPrompt(title, content);

  let rawText;
  try {
    const result = await model.generateContent(prompt);
    rawText = result.response.text();
  } catch (err) {
    throw new Error(`Gemini API call failed: ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`Gemini returned non-JSON response: ${rawText.slice(0, 200)}`);
  }

  const validated = articleLlmSchema.safeParse(parsed);
  if (!validated.success) {
    const issues = validated.error.flatten().fieldErrors;
    throw new Error(`Zod validation failed: ${JSON.stringify(issues)}`);
  }

  return validated.data;
}
