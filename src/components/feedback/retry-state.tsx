"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
export function RetryState({ title, retry }: { title: string; retry?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <section role="alert" className="mx-auto max-w-xl rounded-xl border bg-white p-8 text-center sm:p-12">
    <AlertCircle className="mx-auto mb-4 text-muted-foreground" size={28} />
    <h1 className="text-xl font-semibold">{title}</h1>
    <p className="mt-3 text-sm leading-6 text-muted-foreground">We couldn’t retrieve this information. Try again in a moment.</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Button disabled={pending} onClick={() => startTransition(() => retry ? retry() : router.refresh())}><RotateCcw size={15} className={pending ? "animate-spin" : ""} />{pending ? "Trying again…" : "Try again"}</Button>
      <Button asChild variant="outline"><Link href="/">Search Leads</Link></Button>
    </div>
  </section>;
}
