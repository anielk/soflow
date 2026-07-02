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
  MEDIA_MAX_FILE_SIZE_MB: Joi.number().default(2048),
});