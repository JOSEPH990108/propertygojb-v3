/**
 * Blocking inline script per node_modules/next/dist/docs/01-app/02-guides/
 * preventing-flash-before-hydration.md — runs synchronously while the browser
 * parses the HTML, before first paint, on hard navigations/reloads. Does not
 * re-run on client-side (soft) navigations; pair with client-side logic for
 * that case. Rendered via dangerouslySetInnerHTML to bypass React's hydration
 * constraints, since React doesn't allow <script> tags in components.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<script type="text/javascript">${html}</script>`,
      }}
      suppressHydrationWarning
    />
  );
}
