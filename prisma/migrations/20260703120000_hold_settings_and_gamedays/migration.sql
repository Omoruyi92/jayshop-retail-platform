-- CreateTable
CREATE TABLE "HoldSettings" (
    "id" TEXT NOT NULL,
    "enable48HourHold" BOOLEAN NOT NULL DEFAULT true,
    "standardHoldHours" INTEGER NOT NULL DEFAULT 4,
    "extendedHoldHours" INTEGER NOT NULL DEFAULT 48,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "HoldSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameDay" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "opponent" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameDay_date_key" ON "GameDay"("date");
