"use client";

export type AppToastType = "success" | "error" | "info" | "warning";

export type AppToast = {
  id: string;
  type: AppToastType;
  title: string;
  description?: string;
  duration?: number;
};

type ToastListener = (toast: AppToast) => void;

const listeners = new Set<ToastListener>();

function createToast(type: AppToastType, title: string, description?: string) {
  const toast: AppToast = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    type,
    title,
    description,
    duration: 3000,
  };

  listeners.forEach((listener) => listener(toast));
}

export const appToast = {
  success: (title: string, description?: string) =>
    createToast("success", title, description),
  error: (title: string, description?: string) =>
    createToast("error", title, description),
  info: (title: string, description?: string) =>
    createToast("info", title, description),
  warning: (title: string, description?: string) =>
    createToast("warning", title, description),
};

export function subscribeAppToast(listener: ToastListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
