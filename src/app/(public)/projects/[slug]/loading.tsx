import {
  AppLoadingStatus,
  AppSkeletonCard,
  AppSkeletonText,
} from "@/components/common/app-loading-skeleton";

export default function Loading() {
  return (
    <AppLoadingStatus
      label="Loading project details"
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div
            aria-hidden="true"
            className="motion-safe:animate-pulse h-72 w-full rounded-none bg-muted sm:h-96"
          />
          <AppSkeletonText className="h-8 w-2/3" />
          <AppSkeletonText className="w-1/3" />
        </div>
        <AppSkeletonCard />
      </div>
    </AppLoadingStatus>
  );
}
