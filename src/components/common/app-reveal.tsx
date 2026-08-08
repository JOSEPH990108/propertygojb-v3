"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

type AppRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
};

/** Shared viewport reveal with an accessibility-safe reduced-motion fallback. */
export function AppReveal({
  children,
  className,
  delay = 0,
  distance = 24,
}: AppRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: distance }}
      animate={reduceMotion ? { opacity: 1, y: 0 } : undefined}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
