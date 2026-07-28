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

export function resolveUploadLimitMb(plan: string, override: number | null): number {
  if (override != null) return override;
  return PLAN_UPLOAD_LIMITS_MB[plan] ?? PLAN_UPLOAD_LIMITS_MB.free;
}
