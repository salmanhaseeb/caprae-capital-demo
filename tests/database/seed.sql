\set ON_ERROR_STOP on
-- Run after db:seed against a disposable database, as its administrator.
BEGIN;
DO $$ BEGIN
  IF (SELECT count(*) FROM "Organization" WHERE id IN ('demo-org-acme', 'demo-org-beta')) <> 2 THEN
    RAISE EXCEPTION 'Expected two demo organizations';
  END IF;
  IF (SELECT count(*) FROM "User" WHERE id LIKE 'demo-user-%') <> 4 THEN
    RAISE EXCEPTION 'Expected four demo users';
  END IF;
  IF (SELECT count(*) FROM "Company" WHERE id LIKE 'demo-company-%') <> 30 THEN
    RAISE EXCEPTION 'Expected 30 demo companies';
  END IF;
  IF (SELECT count(*) FROM (SELECT industry FROM "Company" WHERE id LIKE 'demo-company-%' GROUP BY industry HAVING count(*) = 5) sectors) <> 6 THEN
    RAISE EXCEPTION 'Expected five companies in each of six industries';
  END IF;
  IF EXISTS (SELECT FROM "Company" WHERE id LIKE 'demo-company-%' AND
    (location IS NULL OR "estimatedRevenue" IS NULL OR "estimatedRevenue" <= 0 OR "employeeCount" IS NULL OR "employeeCount" <= 0 OR "ceoName" IS NULL OR website IS NULL OR website <> 'https://' || domain OR domain NOT LIKE '%.example')) THEN
    RAISE EXCEPTION 'Incomplete or invalid company fixture';
  END IF;
  IF (SELECT count(*) FROM "Interaction" WHERE "organizationId" = 'demo-org-acme') <> 12 OR
     (SELECT count(DISTINCT "companyId") FROM "Interaction" WHERE "organizationId" = 'demo-org-acme') <> 6 THEN
    RAISE EXCEPTION 'Expected Acme history on six companies';
  END IF;
  IF (SELECT count(*) FROM "Interaction" WHERE "organizationId" = 'demo-org-beta') <> 5 THEN
    RAISE EXCEPTION 'Expected five Beta interactions';
  END IF;
  IF EXISTS (SELECT FROM "Interaction" WHERE id LIKE 'demo-interaction-%' AND
    ("rawNotes" IS NULL OR "aiSummary" IS NULL OR "recommendedAction" IS NULL OR "nextFollowUpAt" <= "createdAt")) THEN
    RAISE EXCEPTION 'Incomplete intelligence or invalid follow-up date';
  END IF;
  IF NOT EXISTS (SELECT FROM "Interaction" WHERE id = 'demo-interaction-acme-bastiontrail-dnc' AND "relationshipStatus" = 'DO_NOT_CONTACT' AND "nextFollowUpAt" IS NULL) THEN
    RAISE EXCEPTION 'Do-not-contact fixture must not schedule outreach';
  END IF;
  IF NOT EXISTS (SELECT FROM "Interaction" WHERE id = 'demo-interaction-acme-waypoint-no-response' AND sentiment = 'UNKNOWN' AND "sellerReadiness" = 'UNKNOWN') THEN
    RAISE EXCEPTION 'Silence must not imply sentiment or readiness';
  END IF;
END $$;

CREATE ROLE search_memory_seed_reader NOLOGIN NOSUPERUSER NOBYPASSRLS;
GRANT USAGE ON SCHEMA public TO search_memory_seed_reader;
GRANT SELECT ON "Company", "Interaction", "User", "Organization" TO search_memory_seed_reader;
SET LOCAL ROLE search_memory_seed_reader;
SELECT set_config('app.organization_id', 'demo-org-acme', true);
DO $$ BEGIN
  IF (SELECT count(*) FROM "Interaction") <> 12 OR EXISTS (SELECT FROM "Interaction" WHERE "organizationId" <> 'demo-org-acme') THEN
    RAISE EXCEPTION 'Acme seed history isolation failed';
  END IF;
  IF (SELECT "relationshipStatus" FROM "Interaction" WHERE "companyId" = 'demo-company-ledgercrest' ORDER BY "createdAt" DESC LIMIT 1) IS DISTINCT FROM 'ENGAGED'::"RelationshipStatus" THEN
    RAISE EXCEPTION 'Acme should see a warm Ledgercrest relationship';
  END IF;
  IF EXISTS (SELECT FROM "Interaction" WHERE "companyId" = 'demo-company-silverquay') THEN
    RAISE EXCEPTION 'Beta-only history leaked into Acme';
  END IF;
END $$;
SELECT set_config('app.organization_id', 'demo-org-beta', true);
DO $$ BEGIN
  IF (SELECT count(*) FROM "Interaction") <> 5 OR EXISTS (SELECT FROM "Interaction" WHERE "organizationId" <> 'demo-org-beta') THEN
    RAISE EXCEPTION 'Beta seed history isolation failed';
  END IF;
  IF (SELECT "relationshipStatus" FROM "Interaction" WHERE "companyId" = 'demo-company-ledgercrest' ORDER BY "createdAt" DESC LIMIT 1) IS DISTINCT FROM 'NOT_INTERESTED'::"RelationshipStatus" THEN
    RAISE EXCEPTION 'Beta should see its own Ledgercrest fit objection';
  END IF;
  IF EXISTS (SELECT FROM "Interaction" WHERE "companyId" = 'demo-company-maplebridge-revenue') THEN
    RAISE EXCEPTION 'Acme-only history leaked into Beta';
  END IF;
  IF NOT EXISTS (SELECT FROM "Company" WHERE id = 'demo-company-maplebridge-revenue') THEN
    RAISE EXCEPTION 'Company catalog must remain shared';
  END IF;
END $$;
ROLLBACK;
\echo 'Seed coverage and tenant-isolation checks passed.'
