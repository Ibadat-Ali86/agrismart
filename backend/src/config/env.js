import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid Postgres connection string"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z.string().default("*"),
  REDIS_URL: z.string().optional(),
  // mail (optional in dev)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  // ai
  AI_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(["gemini", "openai", "lovable"]).default("gemini"),
  AI_MODEL: z.string().optional(),
  // weather
  OPENWEATHER_API_KEY: z.string().optional(),
});

export function loadEnv() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    // eslint-disable-next-line no-console
    console.error(`\n❌ Invalid environment variables:\n${issues}\n`);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
export const isProd = env.NODE_ENV === "production";
