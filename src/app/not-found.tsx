import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="py-28 text-center">
      <Search size={32} className="mx-auto mb-5 text-primary" />
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This page may have moved or the company is no longer available.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to Search Leads</Link>
      </Button>
    </div>
  );
}
