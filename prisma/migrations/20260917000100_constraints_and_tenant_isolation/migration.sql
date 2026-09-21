-- CHECK constraints and row security cannot be represented in schema.prisma.
ALTER TABLE "Company"
  ADD CONSTRAINT "Company_employeeCount_nonnegative" CHECK ("employeeCount" >= 0),
  ADD CONSTRAINT "Company_estimatedRevenue_nonnegative" CHECK ("estimatedRevenue" >= 0),
  ADD CONSTRAINT "Company_domain_canonical" CHECK (
    "domain" = lower(btrim("domain"))
    AND "domain" !~ '[[:space:]/:@]'
    AND "domain" !~ '^www\.'
    AND "domain" !~ '\.$'
    AND length("domain") > 0
  );
ALTER TABLE "User"
  ADD CONSTRAINT "User_email_canonical" CHECK (
    "email" = lower(btrim("email")) AND length("email") > 0
  );
ALTER TABLE "Interaction"
  ADD CONSTRAINT "Interaction_rawNotes_not_blank" CHECK ("rawNotes" ~ '[^[:space:]]');

-- Set app.organization_id from a VERIFIED session, transaction-locally.
-- No context means no private rows. FORCE also applies to ordinary table owners.
-- Runtime credentials must not have SUPERUSER or BYPASSRLS privileges.
ALTER TABLE "Interaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Interaction" FORCE ROW LEVEL SECURITY;
CREATE POLICY "interaction_tenant_isolation" ON "Interaction"
  USING ("organizationId" = nullif(current_setting('app.organization_id', true), ''))
  WITH CHECK ("organizationId" = nullif(current_setting('app.organization_id', true), ''));

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
CREATE POLICY "user_tenant_isolation" ON "User"
  USING ("organizationId" = nullif(current_setting('app.organization_id', true), ''))
  WITH CHECK ("organizationId" = nullif(current_setting('app.organization_id', true), ''));

ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" FORCE ROW LEVEL SECURITY;
CREATE POLICY "organization_tenant_isolation" ON "Organization"
  USING ("id" = nullif(current_setting('app.organization_id', true), ''))
  WITH CHECK ("id" = nullif(current_setting('app.organization_id', true), ''));

-- Company deliberately has no tenant policy: it is the shared catalog.
