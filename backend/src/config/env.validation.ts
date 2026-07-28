import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(4000),
  JWT_SECRET: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  MEDIA_STORAGE_DRIVER: Joi.string().valid('local').default('local'),
  MEDIA_STORAGE_PATH: Joi.string().default('/data/media'),
  // Hard technical ceiling Multer enforces (media.module.ts), not the real
  // per-plan cap — that's PLAN_UPLOAD_LIMITS_MB in media/upload-limits.ts,
  // checked once the uploading workspace is known. Must stay >= the largest
  // plan/override limit in use, or valid uploads get rejected before that
  // check ever runs.
  MEDIA_MAX_FILE_SIZE_MB: Joi.number().default(2048),

  // Public URL used to build links inside emails (reset links, invite links, ...).
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),

  // Global request rate limit — a rolling window, not a lifetime counter.
  // Keyed per client IP (see main.ts's `trust proxy` setting, which makes
  // that IP the real client behind the reverse proxy's X-Forwarded-For,
  // not the proxy itself).
  RATE_LIMIT_TTL_MS: Joi.number().default(60000),
  RATE_LIMIT_MAX: Joi.number().default(300),

  // Notifications — "smtp" is the only implemented driver today; the app is
  // structured so teams/slack/discord/push/sms can be added as new
  // NotificationProvider implementations without touching call sites.
  NOTIFICATION_DRIVER: Joi.string().valid('smtp').default('smtp'),
  NOTIFICATION_TEAM_EMAIL: Joi.string().email({ tlds: false }).default('hello@leinaflow.com'),

  SMTP_HOST: Joi.string().default('localhost'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASSWORD: Joi.string().allow('').default(''),
  SMTP_FROM_NAME: Joi.string().default('Leinaflow'),
  SMTP_FROM_EMAIL: Joi.string().email({ tlds: false }).default('noreply@leinaflow.com'),
  SMTP_REPLY_TO: Joi.string().email({ tlds: false }).allow('').default(''),
});
