-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'LINKEDIN', 'NOTE');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('UNKNOWN', 'CONTACTED', 'ENGAGED', 'NURTURING', 'NOT_INTERESTED', 'DO_NOT_CONTACT');

-- CreateEnum
CREATE TYPE "SellerReadiness" AS ENUM ('UNKNOWN', 'NOT_READY', 'EXPLORING', 'READY');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('UNKNOWN', 'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'MIXED');

-- CreateEnum
CREATE TYPE "SuccessionSignal" AS ENUM ('UNKNOWN', 'NONE', 'POSSIBLE', 'CONFIRMED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "industry" TEXT,
    "location" TEXT,
    "employeeCount" INTEGER,
    "estimatedRevenue" DECIMAL(18,2),
    "ceoName" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interactionType" "InteractionType" NOT NULL,
    "rawNotes" TEXT NOT NULL,
    "aiSummary" TEXT,
    "relationshipStatus" "RelationshipStatus" NOT NULL DEFAULT 'UNKNOWN',
    "sellerReadiness" "SellerReadiness" NOT NULL DEFAULT 'UNKNOWN',
    "sentiment" "Sentiment" NOT NULL DEFAULT 'UNKNOWN',
    "successionSignal" "SuccessionSignal" NOT NULL DEFAULT 'UNKNOWN',
    "recommendedAction" TEXT,
    "nextFollowUpAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_organizationId_id_key" ON "User"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Company_domain_key" ON "Company"("domain");

-- CreateIndex
CREATE INDEX "Company_name_id_idx" ON "Company"("name", "id");

-- CreateIndex
CREATE INDEX "Company_industry_location_idx" ON "Company"("industry", "location");

-- CreateIndex
CREATE INDEX "Company_location_idx" ON "Company"("location");

-- CreateIndex
CREATE INDEX "Company_employeeCount_idx" ON "Company"("employeeCount");

-- CreateIndex
CREATE INDEX "Company_estimatedRevenue_idx" ON "Company"("estimatedRevenue");

-- CreateIndex
CREATE INDEX "Interaction_organizationId_companyId_createdAt_id_idx" ON "Interaction"("organizationId", "companyId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Interaction_organizationId_userId_idx" ON "Interaction"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Interaction_organizationId_nextFollowUpAt_idx" ON "Interaction"("organizationId", "nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Interaction_organizationId_relationshipStatus_idx" ON "Interaction"("organizationId", "relationshipStatus");

-- CreateIndex
CREATE INDEX "Interaction_organizationId_companyId_interactionType_idx" ON "Interaction"("organizationId", "companyId", "interactionType");

-- CreateIndex
CREATE INDEX "Interaction_companyId_idx" ON "Interaction"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Interaction_organizationId_id_key" ON "Interaction"("organizationId", "id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_organizationId_userId_fkey" FOREIGN KEY ("organizationId", "userId") REFERENCES "User"("organizationId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
