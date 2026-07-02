"use client";

import { ReactNode, useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

type ConfirmTone = "danger" | "warning" | "info";

type AppConfirmButtonProps = {
  children: ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  disabled?: boolean;
  className?: string;
  onConfirm: () => void | Promise<void>;
};

const toneClassMap: Record<
  ConfirmTone,
  {
    iconWrap: string;
    icon: string;
    confirmButton: string;
    badge: string;
  }
> = {
  danger: {
    iconWrap: "bg-red-50 text-red-600",
    icon: "text-red-600",
    confirmButton: "bg-red-600 text-white hover:bg-red-700",
    badge: "bg-red-50 text-red-700 ring-red-200",
  },
  warning: {
    iconWrap: "bg-amber-50 text-amber-600",
    icon: "text-amber-600",
    confirmButton: "bg-amber-500 text-white hover:bg-amber-600",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  info: {
    iconWrap: "bg-blue-50 text-blue-600",
    icon: "text-blue-600",
    confirmButton: "bg-blue-600 text-white hover:bg-blue-700",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
  },
};

export function AppConfirmButton({
  children,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "danger",
  disabled,
  className,
  onConfirm,
}: AppConfirmButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const toneClass = toneClassMap[tone];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function handleConfirm() {
    setIsConfirming(true);

    try {
      await onConfirm();
      setIsOpen(false);
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={className}
      >
        {children}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/40 bg-white shadow-2xl">
            <div className="relative p-6">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close confirmation dialog"
              >
                <X className="size-5" />
              </button>

              <div
                className={`grid size-14 place-items-center rounded-2xl ${toneClass.iconWrap}`}
              >
                <AlertTriangle className={`size-7 ${toneClass.icon}`} />
              </div>

              <div className="mt-5">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${toneClass.badge}`}
                >
                  Confirmation Required
                </span>

                <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
                  {title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={isConfirming}
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancelText}
                </button>

                <button
                  type="button"
                  disabled={isConfirming}
                  onClick={handleConfirm}
                  className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClass.confirmButton}`}
                >
                  {isConfirming ? "Processing..." : confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
