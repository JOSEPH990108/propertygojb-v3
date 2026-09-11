export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-50 grid place-items-center bg-background"
      role="status"
    >
      <span className="size-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}