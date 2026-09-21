ALTER TYPE "RelationshipStatus" ADD VALUE 'INTERESTED';
ALTER TABLE "Interaction" ADD COLUMN "aiAnalysis" JSONB, ADD COLUMN "analysisFailed" BOOLEAN NOT NULL DEFAULT false;
