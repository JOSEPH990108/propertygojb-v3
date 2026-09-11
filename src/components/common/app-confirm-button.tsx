"use client";

import { ReactNode, useState } from "react";

import { Dialog } from "@/components/ui/dialog";
import type { AppConfirmTone } from "@/lib/app-confirm";

import { AppConfirmDialogBody } from "./app-confirm-dialog";

type AppConfirmButtonProps = {
  children: ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  tone?: AppConfirmTone;
  disabled?: boolean;
  className?: string;
  onConfirm: () => void | Promise<void>;
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

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!isConfirming) setIsOpen(open);
        }}
      >
        <AppConfirmDialogBody
          tone={tone}
          title={title}
          description={description}
          confirmText={confirmText}
          cancelText={cancelText}
          isConfirming={isConfirming}
          onCancel={() => setIsOpen(false)}
          onConfirm={handleConfirm}
        />
      </Dialog>
    </>
  );
}
