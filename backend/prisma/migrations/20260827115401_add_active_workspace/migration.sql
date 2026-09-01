-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeWorkspaceId" TEXT;

-- Backfill: every existing user gets their oldest membership as their active
-- workspace, preserving today's de facto behavior (resolveMembership already
-- picks the oldest membership) so this migration changes no one's resolved
-- workspace on deploy. Users with no membership at all are left NULL, same
-- as resolveMembership's existing ForbiddenException for that case.
UPDATE "User" u
SET "activeWorkspaceId" = first_membership."workspaceId"
FROM (
  SELECT DISTINCT ON ("userId") "userId", "workspaceId"
  FROM "WorkspaceMember"
  ORDER BY "userId", "joinedAt" ASC
) first_membership
WHERE first_membership."userId" = u.id;

-- CreateIndex
CREATE INDEX "User_activeWorkspaceId_idx" ON "User"("activeWorkspaceId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeWorkspaceId_fkey" FOREIGN KEY ("activeWorkspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
