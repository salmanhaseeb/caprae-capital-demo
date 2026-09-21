"use client";
import { RetryState } from "@/components/feedback/retry-state";
export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RetryState title="This page couldn’t be loaded" retry={retry} />;
}
