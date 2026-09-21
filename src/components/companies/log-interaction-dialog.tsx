"use client";
import { useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle, LoaderCircle, Plus, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  interactionTypes,
  interactionTypeLabels,
  parseInteraction,
  InteractionValidationError,
} from "@/lib/interactions";
import { saveInteraction } from "@/server/interaction-actions";
type Props = {
  companyId: string;
  companyName: string;
  organizationId: string;
  organizationName: string;
  first?: boolean;
  isSuppressed?: boolean;
};
export function LogInteractionDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [requiresConfirmation, setRequiresConfirmation] = useState(!!props.isSuppressed);
  const [confirmed, setConfirmed] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState("");
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const requestId = useRef("");
  const submitting = useRef(false);
  const id = useId();
  function changeOpen(next: boolean) {
    if (pending) return;
    if (next) {
      requestId.current = crypto.randomUUID();
      setRequiresConfirmation(!!props.isSuppressed);
      setConfirmed(false);
      setNotes("");
      setNotesError("");
      setError("");
    }
    setOpen(next);
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (!notes.trim()) {
      setNotesError("Add a few details about the conversation before saving.");
      notesRef.current?.focus();
      return;
    }
    if (requiresConfirmation && !confirmed) {
      setError("Confirm that you understand the Do Not Contact warning before saving.");
      return;
    }
    submitting.current = true;
    setError("");
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await saveInteraction(
          parseInteraction({
            requestId: requestId.current,
            companyId: props.companyId,
            interactionType: data.get("interactionType"),
            rawNotes: data.get("rawNotes"),
            contactName: data.get("contactName"),
            confirmDoNotContact: confirmed,
          }),
          props.organizationId,
        );
        if (!result.success) {
          if ("requiresConfirmation" in result && result.requiresConfirmation) {
            setRequiresConfirmation(true);
            setConfirmed(false);
          }
          setError(result.error);
          return;
        }
        setOpen(false);
        if (result.analysisFailed) {
          toast.warning("Interaction saved", { description: "Your notes are safe. AI analysis is unavailable for this entry." });
        } else {
          toast.success("Interaction saved", { description: "Relationship Memory has been updated." });
        }
      } catch (cause) {
        setError(
          cause instanceof InteractionValidationError ? cause.message :
          "Connection interrupted. Please retry to confirm your interaction was saved.",
        );
      } finally {
        submitting.current = false;
      }
    });
  }
  return (
    <div>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2 text-xs">
            <Plus size={15} />
            {props.first ? "Log First Interaction" : "Log Interaction"}
          </Button>
        </DialogTrigger>
        <DialogContent
          className="max-h-[90svh] overflow-y-auto sm:max-w-[600px]"
          showCloseButton={!pending}
          onInteractOutside={event => { if (pending || notes.trim()) event.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle>Log Interaction</DialogTitle>
            <DialogDescription>
              Keep the next conversation informed. Add a note for{" "}
              {props.companyName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} noValidate aria-busy={pending} className="space-y-5">
            <fieldset disabled={pending} className="space-y-5">
              {requiresConfirmation && (
                <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-950">
                  <h3 className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle size={17} />Do Not Contact</h3>
                  <p className="mt-2 text-xs leading-5">{props.companyName} is marked Do Not Contact for {props.organizationName}. Do not initiate further outreach. Saving a contact log will not remove this restriction.</p>
                  <label className="mt-3 flex items-start gap-2 text-xs font-medium leading-5">
                    <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-red-700" />
                    I understand the Do Not Contact restriction and confirm logging this interaction.
                  </label>
                </div>
              )}
              <div>
                <label
                  htmlFor={`${id}-type`}
                  className="mb-2 block text-xs font-medium"
                >
                  Interaction type
                </label>
                <select
                  id={`${id}-type`}
                  name="interactionType"
                  defaultValue="CALL"
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  {interactionTypes.map((type) => (
                    <option key={type} value={type}>
                      {interactionTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`${id}-contact`} className="mb-2 block text-xs font-medium">
                  Contact Name <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input id={`${id}-contact`} name="contactName" maxLength={200} placeholder="e.g. Michael Roberts" className="bg-white" />
              </div>
              <div>
                <label
                  htmlFor={`${id}-notes`}
                  className="mb-2 block text-xs font-medium"
                >
                  Notes{" "}
                  <span className="font-normal text-muted-foreground">
                    (required)
                  </span>
                </label>
                <textarea
                  id={`${id}-notes`}
                  name="rawNotes"
                  ref={notesRef}
                  value={notes}
                  onChange={event => { setNotes(event.target.value); setNotesError(""); }}
                  aria-invalid={!!notesError}
                  aria-describedby={`${id}-notes-help${notesError ? ` ${id}-notes-error` : ""}`}
                  required
                  maxLength={10000}
                  rows={6}
                  placeholder="Spoke with Michael. He's not interested right now because his daughter recently joined the company. Suggested reconnecting next year."
                  className="w-full resize-y rounded-md border bg-white p-3 text-sm leading-6 aria-invalid:border-destructive outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
                {notesError && <p id={`${id}-notes-error`} role="alert" className="mt-1 text-sm text-destructive">{notesError}</p>}
                <div className="mt-2 flex items-start justify-between gap-4">
                <p id={`${id}-notes-help`} className="text-xs leading-5 text-muted-foreground">
                  AI will summarize your notes and identify relationship status,
                  readiness, and next steps.
                </p>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{notes.length.toLocaleString()} / 10,000</span>
                </div>
              </div>
            </fieldset>
            {pending && <p role="status" className="text-sm text-muted-foreground">Analyzing your notes and saving this interaction…</p>}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="sticky -bottom-6 flex flex-wrap items-center justify-between gap-3 border-t bg-white py-4">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck size={12} />
                {props.organizationName} only
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => changeOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending || (requiresConfirmation && !confirmed)}>
                  {pending && (
                    <LoaderCircle size={14} className="animate-spin" />
                  )}
                  {pending ? "Analyzing & saving…" : "Save"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
