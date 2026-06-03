import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { env } from '../config/env.js';

// ---------------------------------------------------------------------------
// Gemini client
// gemini-flash-lite-latest: alias confirmed working on AQ. key format
// gemini-2.5-flash → only 20 RPD free tier, burns out too fast
// gemini-2.0-flash / gemini-2.0-flash-lite → RPD limit:0 on this account type
// ---------------------------------------------------------------------------
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-flash-lite-latest',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.1,
    maxOutputTokens: 400, // JSON response is ~150-250 tokens; cap prevents truncation
  },
});

// ---------------------------------------------------------------------------
// Valid sub-category constants — single source of truth shared with frontend
// ---------------------------------------------------------------------------
export const SUB_CATEGORIES = {
  BARCELONA:       'BARCELONA',
  NATIONAL_MONDIAL: 'NATIONAL-MONDIAL',
  FOOTBALL_NEWS:   'FOOTBALL-NEWS',
};

// ---------------------------------------------------------------------------
// Zod schema — strict structured output guard (ai-rules.md § 7)
//
// sub_category is z.string(), NOT an enum here.
// Enforcement is handled by forceSubCategory in rss.service.js — the feed
// definition declares the correct value and it is applied as a hard override
// BEFORE this schema runs. Keeping sub_category as a free string means
// adding new categories (AI & Tech, Entertainment, etc.) never requires
// touching this file.
// ---------------------------------------------------------------------------
const articleLlmSchema = z.object({
  category: z.enum([
    'עולם ה-AI והפיתוח',
    'חדשות בעולם הספורט',
    'חדשות בעולם הכדורגל',
    'חדשות כלליות בעולם הבידור',
    'חדשות כלליות בעולם',
  ]),
  sub_category: z.string().min(1),
  tag: z.string().min(1),
  relevance_score: z.number().int().min(1).max(10),
  ai_summary: z.string().min(10),
});

// ---------------------------------------------------------------------------
// Retry helper — respects the API-provided retry delay on 429
// ---------------------------------------------------------------------------
const MAX_RETRY_WAIT_MS = 120_000;

export const QUOTA_ERROR_PREFIX = 'QUOTA_EXHAUSTED:';

function isQuotaError(message) {
  return (
    message.includes('429') ||
    message.includes('quota') ||
    message.includes('QUOTA') ||
    message.includes('rate limit') ||
    message.includes('RATE_LIMIT')
  );
}

async function callWithRetry(prompt) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      if (attempt === 0 && isQuotaError(err.message)) {
        const match = err.message.match(/retry in ([\d.]+)s/i);
        const delaySec = match ? parseFloat(match[1]) : 65;
        const delayMs  = Math.ceil(delaySec * 1000) + 500;

        if (delayMs > MAX_RETRY_WAIT_MS) {
          throw new Error(`${QUOTA_ERROR_PREFIX} Daily quota exhausted (retry in ${Math.ceil(delaySec)}s).`);
        }

        console.log(`[ai] ⏳ RPM limit — waiting ${Math.ceil(delaySec)}s then retrying…`);
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }

      if (isQuotaError(err.message)) {
        throw new Error(`${QUOTA_ERROR_PREFIX} Quota still exhausted after retry.`);
      }

      throw new Error(`Gemini API call failed: ${err.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Post-processor: guarantee summary ends on a complete sentence
// ---------------------------------------------------------------------------
function cleanSummary(text) {
  const trimmed = text.trim();
  if (/[.!?]"?$/.test(trimmed)) return trimmed;
  const lastPunct = Math.max(
    trimmed.lastIndexOf('.'),
    trimmed.lastIndexOf('!'),
    trimmed.lastIndexOf('?')
  );
  return lastPunct > 0 ? trimmed.slice(0, lastPunct + 1) : trimmed;
}

// ---------------------------------------------------------------------------
// Prompt factory
// forceSubCategory: when set, the AI is instructed to use that exact value.
// The value is also overridden in the parsed response as a hard guarantee.
// ---------------------------------------------------------------------------
function buildPrompt(title, content, forceSubCategory) {
  const subCategoryInstruction = forceSubCategory
    ? `חשוב מאוד: שדה sub_category חייב להיות בדיוק "${forceSubCategory}" — ללא חריגה.`
    : `שדה sub_category חייב להיות בדיוק אחד מ: "BARCELONA", "NATIONAL-MONDIAL", "FOOTBALL-NEWS".
  - BARCELONA       ← חדשות הקשורות לברצלונה (שחקנים, תוצאות, העברות)
  - NATIONAL-MONDIAL ← נבחרות לאומיות, מונדיאל, יורו, קאפה דל ריי
  - FOOTBALL-NEWS   ← חדשות כדורגל כלליות שאינן ברצלונה ואינן מונדיאל`;

  return `
אתה עורך חדשות כדורגל מקצועי בעברית. קרא את הכתבה וחזור JSON בלבד.

כתבה:
כותרת: ${title}
תוכן: ${(content ?? '').slice(0, 800)}

${subCategoryInstruction}

חוקי הסיכום (חובה לעמוד בהם):
1. כתוב בדיוק 2 משפטים שלמים בעברית.
2. כל משפט חייב להסתיים בנקודה (.) או בסימן קריאה (!) או שאלה (?).
3. אל תחתוך משפט באמצע — כל משפט חייב להיות שלם ומובן.
4. הסיכום מיועד לכרטיס חדשות קטן — תמציתי וברור.

פורמט JSON נדרש (ללא שדות נוספים):
{
  "category": "<אחד מהערכים המותרים בדיוק>",
  "sub_category": "<BARCELONA | NATIONAL-MONDIAL | FOOTBALL-NEWS>",
  "tag": "<האשטאג אחד רלוונטי בעברית, למשל: #ברצלונה>",
  "relevance_score": <מספר שלם 1-10>,
  "ai_summary": "<משפט ראשון שלם. משפט שני שלם.>"
}

ערכי category המותרים:
- "עולם ה-AI והפיתוח"           ← טכנולוגיה, תוכנה, בינה מלאכותית
- "חדשות בעולם הספורט"          ← ספורט כללי (כדורסל, טניס וכו')
- "חדשות בעולם הכדורגל"         ← כדורגל בלבד
- "חדשות כלליות בעולם הבידור"   ← קולנוע, מוזיקה, בידור
- "חדשות כלליות בעולם"          ← פוליטיקה, כלכלה, מדע

החזר JSON תקין בלבד. ללא markdown, ללא טקסט מחוץ ל-JSON.
`.trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Categorises an article and returns a validated Hebrew summary.
 *
 * @param {string} title
 * @param {string|null|undefined} content
 * @param {string|null} forceSubCategory — if set, overrides AI's sub_category choice.
 *   Must be one of the SUB_CATEGORIES values.
 * @returns {Promise<z.infer<typeof articleLlmSchema>>}
 */
export async function categorizeArticle(title, content, forceSubCategory = null) {
  const prompt = buildPrompt(title, content, forceSubCategory);

  const rawText = await callWithRetry(prompt);

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`Gemini returned non-JSON: ${rawText.slice(0, 200)}`);
  }

  // Hard guarantee: forceSubCategory always wins, regardless of what AI returned
  if (forceSubCategory) {
    parsed.sub_category = forceSubCategory;
  }

  if (parsed?.ai_summary) {
    parsed.ai_summary = cleanSummary(parsed.ai_summary);
  }

  const validated = articleLlmSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Zod validation failed: ${JSON.stringify(validated.error.flatten().fieldErrors)}`);
  }

  return validated.data;
}
