import { Role } from '@prisma/client';
import { PLAN_UPLOAD_LIMITS_MB, resolveUploadLimitMb } from './upload-limits';

describe('resolveUploadLimitMb', () => {
  it('returns the plan default when there is no override and no admin caller', () => {
    expect(resolveUploadLimitMb('free', null)).toBe(PLAN_UPLOAD_LIMITS_MB.free);
  });

  it("returns the workspace's override when one is set", () => {
    expect(resolveUploadLimitMb('free', 9999)).toBe(9999);
  });

  it('bypasses the plan cap entirely for a SUPER_ADMIN caller, even on a free-plan workspace', () => {
    expect(resolveUploadLimitMb('free', null, Role.SUPER_ADMIN)).toBe(Number.POSITIVE_INFINITY);
  });

  it('bypasses the cap for SUPER_ADMIN even when the workspace has a lower explicit override', () => {
    expect(resolveUploadLimitMb('free', 10, Role.SUPER_ADMIN)).toBe(Number.POSITIVE_INFINITY);
  });

  it('does not bypass the cap for a non-platform-admin role (workspace OWNER)', () => {
    expect(resolveUploadLimitMb('free', null, Role.OWNER)).toBe(PLAN_UPLOAD_LIMITS_MB.free);
  });
});
