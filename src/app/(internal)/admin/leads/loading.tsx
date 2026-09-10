import {
  AppLoadingStatus,
  AppSkeletonRow,
  AppSkeletonText,
} from "@/components/common/app-loading-skeleton";

export default function Loading() {
  return (
    <AppLoadingStatus label="Loading leads" className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 space-y-3">
        <AppSkeletonText className="h-7 w-40" />
        <AppSkeletonText className="w-64" />
      </div>
      <div className="divide-y divide-border rounded-2xl border border-border p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <AppSkeletonRow key={index} />
        ))}
      </div>
    </AppLoadingStatus>
  );
}
