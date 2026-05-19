-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "allowDurationOnlyMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowStartDurationMode" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowTimesMode" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "time_entries" ADD COLUMN     "durationOnly" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "startedAt" DROP NOT NULL;
