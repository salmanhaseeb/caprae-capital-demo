\set ON_ERROR_STOP on
-- Run on a disposable migrated database as its administrator. Always rolled back.
BEGIN;
CREATE ROLE search_memory_test_runtime NOLOGIN NOSUPERUSER NOBYPASSRLS;
GRANT USAGE ON SCHEMA public TO search_memory_test_runtime;
GRANT SELECT ON "Company", "User", "Organization" TO search_memory_test_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Interaction" TO search_memory_test_runtime;

INSERT INTO "Organization" (id, name) VALUES ('org-a', 'A'), ('org-b', 'B');
INSERT INTO "User" (id, name, email, "organizationId") VALUES
  ('user-a', 'A', 'a@example.test', 'org-a'), ('user-b', 'B', 'b@example.test', 'org-b');
INSERT INTO "Company" (id, name, domain) VALUES ('shared', 'Shared', 'shared.example');
INSERT INTO "Interaction" (id, "organizationId", "companyId", "userId", "interactionType", "rawNotes") VALUES
  ('note-a', 'org-a', 'shared', 'user-a', 'CALL', 'Private A'),
  ('note-b', 'org-b', 'shared', 'user-b', 'EMAIL', 'Private B');

DO $$ BEGIN
  BEGIN
    INSERT INTO "Company" (id, name, domain, "employeeCount") VALUES ('bad-count', 'Bad', 'count.example', -1);
    RAISE EXCEPTION 'Negative employee count accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    INSERT INTO "Company" (id, name, domain, "estimatedRevenue") VALUES ('bad-revenue', 'Bad', 'revenue.example', -1);
    RAISE EXCEPTION 'Negative revenue accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    INSERT INTO "Company" (id, name, domain) VALUES ('duplicate', 'Duplicate', 'shared.example');
    RAISE EXCEPTION 'Duplicate company domain accepted';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    INSERT INTO "Company" (id, name, domain) VALUES ('bad-domain', 'Bad', 'WWW.Shared.Example');
    RAISE EXCEPTION 'Noncanonical domain accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    INSERT INTO "User" (id, name, email, "organizationId") VALUES ('duplicate-email', 'Bad', 'a@example.test', 'org-b');
    RAISE EXCEPTION 'Duplicate user email accepted';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    DELETE FROM "Company" WHERE id = 'shared';
    RAISE EXCEPTION 'Referenced company deletion accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
END $$;

SET LOCAL ROLE search_memory_test_runtime;
DO $$ BEGIN
  IF EXISTS (SELECT FROM "Interaction") OR EXISTS (SELECT FROM "User") OR EXISTS (SELECT FROM "Organization") THEN
    RAISE EXCEPTION 'Missing tenant context exposed private rows';
  END IF;
  BEGIN
    INSERT INTO "Interaction" (id, "organizationId", "companyId", "userId", "interactionType", "rawNotes")
      VALUES ('no-context', 'org-a', 'shared', 'user-a', 'NOTE', 'Forbidden');
    RAISE EXCEPTION 'Missing tenant context allowed write';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('app.organization_id', 'org-a', true);
DO $$ BEGIN
  IF (SELECT count(*) FROM "Interaction") <> 1 OR NOT EXISTS (SELECT FROM "Interaction" WHERE id = 'note-a') THEN
    RAISE EXCEPTION 'A cannot see exactly its own interaction';
  END IF;
  IF (SELECT count(*) FROM "Company") <> 1 OR (SELECT count(*) FROM "User") <> 1 OR (SELECT count(*) FROM "Organization") <> 1 THEN
    RAISE EXCEPTION 'Shared catalog or tenant identity visibility incorrect';
  END IF;
  IF (SELECT count(*) FROM "Company" c JOIN "Interaction" i ON i."companyId" = c.id) <> 1 THEN
    RAISE EXCEPTION 'Company join leaked interactions';
  END IF;
  UPDATE "Interaction" SET "rawNotes" = 'Leaked' WHERE id = 'note-b';
  IF FOUND THEN RAISE EXCEPTION 'Cross-tenant update succeeded'; END IF;
  DELETE FROM "Interaction" WHERE id = 'note-b';
  IF FOUND THEN RAISE EXCEPTION 'Cross-tenant delete succeeded'; END IF;
  BEGIN
    INSERT INTO "Interaction" (id, "organizationId", "companyId", "userId", "interactionType", "rawNotes")
      VALUES ('forged-tenant', 'org-b', 'shared', 'user-b', 'NOTE', 'Forbidden');
    RAISE EXCEPTION 'Cross-tenant insert accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO "Interaction" (id, "organizationId", "companyId", "userId", "interactionType", "rawNotes")
      VALUES ('forged-author', 'org-a', 'shared', 'user-b', 'NOTE', 'Forbidden');
    RAISE EXCEPTION 'Cross-tenant author accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  BEGIN
    UPDATE "Interaction" SET "organizationId" = 'org-b', "userId" = 'user-b' WHERE id = 'note-a';
    RAISE EXCEPTION 'Tenant reassignment accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO "Interaction" (id, "organizationId", "companyId", "userId", "interactionType", "rawNotes")
      VALUES ('blank', 'org-a', 'shared', 'user-a', 'NOTE', E' \n\t');
    RAISE EXCEPTION 'Blank notes accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  INSERT INTO "Interaction" (id, "organizationId", "companyId", "userId", "interactionType", "rawNotes")
    VALUES ('own-note', 'org-a', 'shared', 'user-a', 'NOTE', 'Allowed');
  IF NOT EXISTS (SELECT FROM "Interaction" WHERE id = 'own-note' AND "relationshipStatus" = 'UNKNOWN' AND "aiSummary" IS NULL) THEN
    RAISE EXCEPTION 'Own write or unextracted defaults incorrect';
  END IF;
END $$;
SELECT set_config('app.organization_id', 'org-b', true);
DO $$ BEGIN
  IF (SELECT count(*) FROM "Interaction") <> 1 OR NOT EXISTS (SELECT FROM "Interaction" WHERE id = 'note-b' AND "rawNotes" = 'Private B') THEN
    RAISE EXCEPTION 'B isolation failed';
  END IF;
END $$;
SELECT set_config('app.organization_id', '', true);
DO $$ BEGIN
  IF EXISTS (SELECT FROM "Interaction") THEN RAISE EXCEPTION 'Empty context exposed interactions'; END IF;
END $$;
ROLLBACK;
\echo 'Tenant isolation and constraint checks passed (all fixtures rolled back).'
