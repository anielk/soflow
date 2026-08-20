import { Role } from '@prisma/client';

// Per-plan upload caps. `MEDIA_MAX_FILE_SIZE_MB` (env, enforced by Multer in
// media.module.ts) is a hard technical ceiling that bounds disk/DoS exposure
// regardless of plan — it must stay >= the largest value here. These are the
// real, business-facing limits, checked in MediaService against the
// uploading workspace's plan (and its `maxUploadSizeMb` override, for a
// negotiated Enterprise limit).
export const PLAN_UPLOAD_LIMITS_MB: Record<string, number> = {
  free: 100,
  pro: 500,
  enterprise: 2048,
};

/**
 * `callerRole` is the caller's GLOBAL platform role (User.role, from the
 * JWT) — not a workspace's billing plan. Workspace.plan stays exactly what
 * it says (a real, workspace-scoped subscription field; there is no
 * billing/subscription backend in this app — see the Cloudivo-owned
 * Billing/Subscriptions admin pages) and is never touched here. SUPER_ADMIN
 * bypasses the plan-derived cap entirely so platform administration and
 * testing are never blocked by whatever plan a given workspace happens to
 * be on — this is the one place plan currently gates any real behavior.
 */
export function resolveUploadLimitMb(plan: string, override: number | null, callerRole?: Role): number {
  if (callerRole === Role.SUPER_ADMIN) return Number.POSITIVE_INFINITY;
  if (override != null) return override;
  return PLAN_UPLOAD_LIMITS_MB[plan] ?? PLAN_UPLOAD_LIMITS_MB.free;
}
