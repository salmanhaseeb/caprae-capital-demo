export const interactionTypes = [
  "CALL",
  "EMAIL",
  "MEETING",
  "LINKEDIN",
  "OTHER",
] as const;
export const relationshipStatuses = [
  "UNKNOWN",
  "CONTACTED",
  "ENGAGED",
  "INTERESTED",
  "NURTURING",
  "NOT_INTERESTED",
  "DO_NOT_CONTACT",
] as const;
export const sellerReadinessValues = [
  "UNKNOWN",
  "NOT_READY",
  "EXPLORING",
  "READY",
] as const;
export const interactionTypeLabels = {
  CALL: "Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  LINKEDIN: "LinkedIn",
  NOTE: "Internal note",
  OTHER: "Other",
};
export const relationshipStatusLabels = {
  UNKNOWN: "Unknown",
  CONTACTED: "Previously Contacted",
  ENGAGED: "Warm",
  INTERESTED: "Interested",
  NURTURING: "Follow Up",
  NOT_INTERESTED: "Not Interested",
  DO_NOT_CONTACT: "Do Not Contact",
};
export const sellerReadinessLabels = {
  UNKNOWN: "Unknown",
  NOT_READY: "Not ready",
  EXPLORING: "Exploring options",
  READY: "Ready to discuss",
};
export type InteractionInput = {
  requestId: string;
  companyId: string;
  interactionType: (typeof interactionTypes)[number];
  rawNotes: string;
  contactName: string;
  confirmDoNotContact?: boolean;
};
export class InteractionValidationError extends Error {}
export class DoNotContactConfirmationRequired extends InteractionValidationError {
  constructor() { super("This company is marked Do Not Contact for your organization. Explicit confirmation is required to log this interaction."); }
}
export function parseInteraction(input: unknown): InteractionInput {
  if (!input || typeof input !== "object")
    throw new InteractionValidationError(
      "Please complete the interaction form.",
    );
  const record = input as Record<string, unknown>;
  if (record.confirmDoNotContact !== undefined && typeof record.confirmDoNotContact !== "boolean")
    throw new InteractionValidationError("Invalid Do Not Contact confirmation.");
  function text(key: string, max: number, required = false) {
    if (typeof record[key] !== "string")
      throw new InteractionValidationError(`Invalid ${key}.`);
    const value = (record[key] as string).trim();
    if ((record[key] as string).length > max || (required && !value))
      throw new InteractionValidationError(
        key === "rawNotes"
          ? `Original notes are required and must be no longer than ${max.toLocaleString("en-US")} characters.`
          : `Invalid ${key}.`,
      );
    return value;
  }
  const requestId = text("requestId", 36, true);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      requestId,
    )
  )
    throw new InteractionValidationError(
      "Please reopen the interaction form and try again.",
    );
  const companyId = text("companyId", 128, true);
  text("rawNotes", 10000, true);
  const rawNotes = record.rawNotes as string; // Preserve the author’s original wording.
  const contactName = text("contactName", 200);
  const type = record.interactionType;
  if (!interactionTypes.includes(type as InteractionInput["interactionType"]))
    throw new InteractionValidationError("Choose a valid interaction type.");
  return {
    ...(record.confirmDoNotContact !== undefined ? { confirmDoNotContact: record.confirmDoNotContact as boolean } : {}),
    requestId,
    companyId,
    rawNotes,
    contactName,
    interactionType: type as InteractionInput["interactionType"],
  };
}
export function safeWebsiteUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export function lastContacted<
  T extends { interactionType: string; createdAt: Date },
>(entries: readonly T[]): Date | null {
  return entries.reduce<Date | null>(
    (latest, entry) =>
      entry.interactionType !== "NOTE" && (!latest || entry.createdAt > latest)
        ? entry.createdAt
        : latest,
    null,
  );
}
