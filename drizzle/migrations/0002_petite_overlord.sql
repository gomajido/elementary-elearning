-- Backfill pre-existing free-text/null gender values to the new "male"/"female"
-- enum before enforcing NOT NULL (gender used to be a free-text optional field).
UPDATE "students" SET "gender" = 'male' WHERE "gender" = 'Laki-laki';
UPDATE "students" SET "gender" = 'female' WHERE "gender" = 'Perempuan';
UPDATE "students" SET "gender" = 'male' WHERE "gender" IS NULL OR "gender" NOT IN ('male', 'female');
ALTER TABLE "students" ALTER COLUMN "gender" SET NOT NULL;