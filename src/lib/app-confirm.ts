export type AppConfirmTone = "danger" | "warning" | "info";

/**
 * Shared visual tone tokens for confirmation dialogs. Kept alongside the plain
 * confirm types (no `@/` aliases) so both AppConfirmProvider and AppConfirmButton
 * render the same presentation instead of maintaining separate copies.
 */
export const confirmToneClassNames: Record<
  AppConfirmTone,
  {
    iconWrap: string;
    badge: string;
    confirmButton: string;
  }
> = {
  danger: {
    iconWrap: "bg-red-50 text-red-600",
    badge: "bg-red-50 text-red-700 ring-red-200",
    confirmButton: "bg-red-600 text-white hover:bg-red-700",
  },
  warning: {
    iconWrap: "bg-amber-50 text-amber-600",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    confirmButton: "bg-amber-500 text-white hover:bg-amber-600",
  },
  info: {
    iconWrap: "bg-blue-50 text-blue-600",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    confirmButton: "bg-blue-600 text-white hover:bg-blue-700",
  },
};

export type AppConfirmOptions = {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  tone?: AppConfirmTone;
};

export type AppConfirmRequest = Required<AppConfirmOptions> & {
  resolve: (confirmed: boolean) => void;
};

let confirmListener: ((request: AppConfirmRequest) => void) | null = null;

export function setAppConfirmListener(
  listener: (request: AppConfirmRequest) => void,
) {
  confirmListener = listener;

  return () => {
    if (confirmListener === listener) {
      confirmListener = null;
    }
  };
}

export function appConfirm(options: AppConfirmOptions) {
  return new Promise<boolean>((resolve) => {
    const request: AppConfirmRequest = {
      title: options.title,
      description: options.description,
      confirmText: options.confirmText ?? "Confirm",
      cancelText: options.cancelText ?? "Cancel",
      tone: options.tone ?? "danger",
      resolve,
    };

    if (!confirmListener) {
      resolve(false);
      return;
    }

    confirmListener(request);
  });
}
