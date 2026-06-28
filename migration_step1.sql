-- Step 1: Add columns as nullable
ALTER TABLE "User" ADD COLUMN username TEXT;
ALTER TABLE "User" ADD COLUMN bannerUrl TEXT;
ALTER TABLE "CreatorProfile" ADD COLUMN bannerUrl TEXT;

-- Step 2: Populate existing usernames from email (before @)
UPDATE "User" SET username = LOWER(SPLIT_PART(email, '@', 1)) WHERE username IS NULL;

-- Step 3: Make username NOT NULL and add unique constraint
ALTER TABLE "User" ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"(username);
