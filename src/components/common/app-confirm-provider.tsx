"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import {
  AppConfirmRequest,
  AppConfirmTone,
  setAppConfirmListener,
} from "@/lib/app-confirm";

const toneClassMap: Record<
  AppConfirmTone,
  {
    iconWrap: string;
    icon: React.ReactNode;
    badge: string;
    confirmButton: string;
  }
> = {
  danger: {
    iconWrap: "bg-red-50 text-red-600",
    icon: <AlertTriangle className="size-7" />,
    badge: "bg-red-50 text-red-700 ring-red-200",
    confirmButton: "bg-red-600 text-white hover:bg-red-700",
  },
  warning: {
    iconWrap: "bg-amber-50 text-amber-600",
    icon: <AlertTriangle className="size-7" />,
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    confirmButton: "bg-amber-500 text-white hover:bg-amber-600",
  },
  info: {
    iconWrap: "bg-blue-50 text-blue-600",
    icon: <Info className="size-7" />,
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    confirmButton: "bg-blue-600 text-white hover:bg-blue-700",
  },
};

export function AppConfirmProvider() {
  const [request, setRequest] = useState<AppConfirmRequest | null>(null);

  useEffect(() => {
    return setAppConfirmListener((nextRequest) => {
      setRequest(nextRequest);
    });
  }, []);

  useEffect(() => {
    if (!request) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setRequest((currentRequest) => {
          currentRequest?.resolve(false);
          return null;
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [request]);

  function handleCancel() {
    setRequest((currentRequest) => {
      currentRequest?.resolve(false);
      return null;
    });
  }

  function handleConfirm() {
    setRequest((currentRequest) => {
      currentRequest?.resolve(true);
      return null;
    });
  }

  if (!request) {
    return null;
  }

  const toneClass = toneClassMap[request.tone];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/40 bg-white shadow-2xl">
        <div className="relative p-6">
          <button
            type="button"
            onClick={handleCancel}
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close confirmation dialog"
          >
            <X className="size-5" />
          </button>

          <div
            className={`grid size-14 place-items-center rounded-2xl ${toneClass.iconWrap}`}
          >
            {toneClass.icon}
          </div>

          <div className="mt-5">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${toneClass.badge}`}
            >
              Confirmation Required
            </span>

            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
              {request.title}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {request.description}
            </p>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {request.cancelText}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold shadow-sm transition ${toneClass.confirmButton}`}
            >
              <CheckCircle2 className="size-4" />
              {request.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
