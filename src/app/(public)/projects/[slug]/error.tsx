"use client";

import { AppErrorState } from "@/components/common/app-error-state";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <AppErrorState
        title="Unable to load this project"
        description="Please try again. If the problem continues, contact support."
        onRetry={reset}
      />
    </div>
  );
}
