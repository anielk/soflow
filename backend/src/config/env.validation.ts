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
  // A localhost default is meaningless outside a developer's own machine, so
  // it's only applied in development/test — production must set it explicitly
  // or fail to boot, rather than silently mailing out unreachable links.
  FRONTEND_URL: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().default('http://localhost:3000'),
  }),

  // Global request rate limit — a rolling window, not a lifetime counter.
  // Keyed per client IP (see main.ts's `trust proxy` setting, which makes
  // that IP the real client behind the reverse proxy's X-Forwarded-For,
  // not the proxy itself).
  RATE_LIMIT_TTL_MS: Joi.number().default(60000),
  RATE_LIMIT_MAX: Joi.number().default(300),

  // Notifications — "smtp" is the only implemented channel today; the app is
  // structured so teams/slack/discord/push/sms can be added as new
  // NotificationProvider implementations without touching call sites.
  // "disabled" (or "smtp" with SMTP_HOST left blank) runs with no
  // notification provider at all — see NotificationModule's factory and
  // DisabledNotificationProvider. Never required for the app to start: a
  // host with no mail relay configured yet must still deploy and report
  // healthy.
  //
  // `.empty('')` on every field below (except the SMTP_HOST-style ones,
  // where blank is itself a meaningful value — see next comment) treats an
  // empty string the same as the key being absent, so `.default(...)`
  // applies either way. This matters regardless of NOTIFICATION_DRIVER:
  // NotificationModule always registers SmtpProvider as a Nest provider
  // (see notification.module.ts), so its constructor — and therefore this
  // validation — runs unconditionally even when the driver is "disabled".
  // Compose also always sets these keys (via `${VAR}` interpolation in
  // compose.yml), producing an empty string rather than an absent key when
  // an env file doesn't define them — `.empty('')` is what makes an
  // incomplete env file degrade to sane defaults instead of crashing the
  // whole app at boot (see docs/deployment/Architecture.md).
  NOTIFICATION_DRIVER: Joi.string().valid('smtp', 'disabled').empty('').default('smtp'),
  NOTIFICATION_TEAM_EMAIL: Joi.string().email({ tlds: false }).empty('').default('hello@leinaflow.com'),

  // Left blank on purpose (unlike every other default here) — a non-empty
  // value is what NotificationModule/SmtpProvider treat as "an operator
  // actually configured this", so a placeholder host would make the
  // notification_provider health check attempt a real connection instead of
  // reporting itself not_configured. `.allow('')` (not `.empty('')`): blank
  // is itself the valid, meaningful value here, not a stand-in for "apply
  // the default instead".
  SMTP_HOST: Joi.string().allow('').default(''),
  SMTP_PORT: Joi.number().empty('').default(587),
  SMTP_SECURE: Joi.boolean().empty('').default(false),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASSWORD: Joi.string().allow('').default(''),
  SMTP_FROM_NAME: Joi.string().empty('').default('Leinaflow'),
  SMTP_FROM_EMAIL: Joi.string().email({ tlds: false }).empty('').default('noreply@leinaflow.com'),
  SMTP_REPLY_TO: Joi.string().email({ tlds: false }).allow('').default(''),
});
