export type AppConfirmTone = "danger" | "warning" | "info";

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
