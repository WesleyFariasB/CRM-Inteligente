import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z
    .url()
    .default('postgresql://crm:crm@localhost:5432/crm_inteligente?schema=public'),
  REDIS_URL: z.url().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32)
    .default('development-access-secret-change-before-production'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32)
    .default('development-refresh-secret-change-before-production'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  JWT_ISSUER: z.string().default('crm-inteligente-api'),
  JWT_AUDIENCE: z.string().default('crm-inteligente-web'),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  ENABLE_SWAGGER: z.coerce.boolean().default(true),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(config: Record<string, unknown>): Environment {
  const parsed = environmentSchema.safeParse(config);

  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${z.prettifyError(parsed.error)}`);
  }

  const environment = parsed.data;
  const usesDevelopmentSecrets =
    environment.JWT_ACCESS_SECRET.includes('development-') ||
    environment.JWT_REFRESH_SECRET.includes('development-');

  if (environment.NODE_ENV === 'production' && usesDevelopmentSecrets) {
    throw new Error('Production requires non-default JWT secrets.');
  }

  if (environment.NODE_ENV === 'production' && !environment.COOKIE_SECURE) {
    throw new Error('Production requires secure session cookies.');
  }

  return environment;
}
