"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";

import {
  type AppToast,
  subscribeAppToast,
} from "@/lib/app-toast";
import { cn } from "@/lib/utils";

function getToastIcon(type: AppToast["type"]) {
  switch (type) {
    case "success":
      return <CheckCircle2 className="size-5 text-emerald-600" />;
    case "error":
      return <XCircle className="size-5 text-red-600" />;
    case "warning":
      return <TriangleAlert className="size-5 text-amber-600" />;
    default:
      return <Info className="size-5 text-blue-600" />;
  }
}

function getToastClassName(type: AppToast["type"]) {
  switch (type) {
    case "success":
      return "border-emerald-200 bg-emerald-50";
    case "error":
      return "border-red-200 bg-red-50";
    case "warning":
      return "border-amber-200 bg-amber-50";
    default:
      return "border-blue-200 bg-blue-50";
  }
}

export function AppToastProvider() {
  const [toasts, setToasts] = useState<AppToast[]>([]);

  useEffect(() => {
    return subscribeAppToast((toast) => {
      setToasts((current) => [toast, ...current]);

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, toast.duration ?? 3000);
    });
  }, []);

  function removeToast(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.22}
            initial={{ opacity: 0, x: 80, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 120, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 90) {
                removeToast(toast.id);
              }
            }}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl",
              getToastClassName(toast.type),
            )}
          >
            <div className="mt-0.5 shrink-0">{getToastIcon(toast.type)}</div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {toast.description}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="grid size-7 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-white/70 hover:text-slate-900"
              aria-label="Close notification"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
