-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF', 'VIEWER');

-- AlterTable
ALTER TABLE "Admin" ALTER COLUMN "role" DROP DEFAULT,
ALTER COLUMN "role" TYPE "AdminRole" USING (
  CASE "role"
    WHEN 'OWNER' THEN 'OWNER'::"AdminRole"
    WHEN 'MANAGER' THEN 'MANAGER'::"AdminRole"
    WHEN 'STAFF' THEN 'STAFF'::"AdminRole"
    WHEN 'VIEWER' THEN 'VIEWER'::"AdminRole"
    ELSE 'OWNER'::"AdminRole"
  END
),
ALTER COLUMN "role" SET DEFAULT 'STAFF';

-- Backfill every existing admin to OWNER so current behaviour is preserved.
UPDATE "Admin" SET "role" = 'OWNER';
