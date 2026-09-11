import Link from "next/link";
import { SearchX } from "lucide-react";

import { AppButton } from "@/components/common/app-button";
import { AppEmptyState } from "@/components/common/app-empty-state";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <AppEmptyState
        icon={SearchX}
        title="Project not found"
        description="This project may have been unpublished or the link is out of date. Browse current projects instead."
        action={
          <AppButton asChild appVariant="outline">
            <Link href="/projects">Browse projects</Link>
          </AppButton>
        }
      />
    </div>
  );
}
