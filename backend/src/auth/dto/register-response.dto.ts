/**
 * Previously `register()` returned the raw Prisma User row, leaking
 * passwordHash to any direct API caller. It now returns the same shape as
 * login — a token only — so the frontend can sign the new user straight
 * into their new workspace without a separate login step.
 */
export class RegisterResponseDto {
  access_token!: string;
}
