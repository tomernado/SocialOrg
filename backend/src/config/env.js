import { z } from 'zod';
import 'dotenv/config';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  // Optional — only needed when targeting production Postgres/Supabase.
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string').optional(),
  // Required from Phase 3 onwards — get a free key at https://aistudio.google.com/app/apikey
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required — get a free key at https://aistudio.google.com/app/apikey'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL (e.g. http://localhost:5173)').default('http://localhost:5173'),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error('\n❌  Environment validation failed — server refusing to start.\n');
  console.error('Missing or invalid variables:');
  for (const [field, messages] of Object.entries(result.error.flatten().fieldErrors)) {
    console.error(`  • ${field}: ${messages.join(', ')}`);
  }
  console.error('\nCopy backend/.env.example to backend/.env and fill in all required values.\n');
  process.exit(1);
}

export const env = result.data;
