"use client";

import { AppErrorState } from "@/components/common/app-error-state";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AppErrorState
        title="Unable to load leads"
        description="Please try again. If the problem continues, contact support."
        onRetry={reset}
      />
    </div>
  );
}
