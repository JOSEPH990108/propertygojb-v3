import {
  AppLoadingStatus,
  AppSkeletonCard,
  AppSkeletonText,
} from "@/components/common/app-loading-skeleton";

export default function Loading() {
  return (
    <AppLoadingStatus
      label="Loading projects"
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="mb-8 space-y-3">
        <AppSkeletonText className="h-8 w-48" />
        <AppSkeletonText className="w-72" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <AppSkeletonCard key={index} />
        ))}
      </div>
    </AppLoadingStatus>
  );
}
