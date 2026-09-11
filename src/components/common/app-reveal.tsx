"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import { motion } from "motion/react";

type AppRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/** Shared viewport reveal with an accessibility-safe reduced-motion fallback. */
export function AppReveal({
  children,
  className,
  delay = 0,
  distance = 24,
}: AppRevealProps) {
  // useSyncExternalStore's server snapshot always matches the first client
  // render, so this never produces a hydration mismatch (unlike deriving the
  // preference via useState+useEffect).
  const reduceMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  return (
    <motion.div
      className={className}
      initial={
        reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: distance }
      }
      animate={reduceMotion ? { opacity: 1, y: 0 } : undefined}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
