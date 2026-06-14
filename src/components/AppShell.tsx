/**
 * AppShell — thin entry point mounted by Astro (client:load).
 *
 * Issue 4 fix: The full App.tsx is 5000+ lines. Without code splitting, the
 * browser downloads, parses, and executes the entire bundle before anything is
 * interactive. This file is intentionally tiny — it shows the loading spinner
 * immediately, then lazily imports the real App component so the heavy JS
 * chunk is fetched and parsed in the background (in parallel with the
 * /api/bootstrap network request).
 *
 * Result: the loading UI is interactive ~instantly, and the main chunk is
 * ready by the time the API responds.
 */

import { lazy, Suspense } from "react";

// Vite/Rollup sees the dynamic import() and splits App.tsx into its own chunk.
const LazyApp = lazy(() => import("./App"));

function LoadingSpinner() {
  return (
    <main className="startup-spinner" role="status" aria-label="Loading">
      <div className="orbit">
        <div className="orbit-ring" aria-hidden="true" />
        <img src="/nokia-3310.svg" alt="" />
      </div>
    </main>
  );
}

export default function AppShell() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyApp />
    </Suspense>
  );
}
