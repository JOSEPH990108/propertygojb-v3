"use client";

import { useEffect, useState } from "react";

import { Dialog } from "@/components/ui/dialog";
import { AppConfirmRequest, setAppConfirmListener } from "@/lib/app-confirm";

import { AppConfirmDialogBody } from "./app-confirm-dialog";

export function AppConfirmProvider() {
  const [request, setRequest] = useState<AppConfirmRequest | null>(null);

  useEffect(() => {
    return setAppConfirmListener((nextRequest) => {
      setRequest(nextRequest);
    });
  }, []);

  function resolveAndClose(result: boolean) {
    setRequest((currentRequest) => {
      currentRequest?.resolve(result);
      return null;
    });
  }

  if (!request) {
    return null;
  }

  return (
    <Dialog
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open) resolveAndClose(false);
      }}
    >
      <AppConfirmDialogBody
        tone={request.tone}
        title={request.title}
        description={request.description}
        confirmText={request.confirmText}
        cancelText={request.cancelText}
        isConfirming={false}
        onCancel={() => resolveAndClose(false)}
        onConfirm={() => resolveAndClose(true)}
      />
    </Dialog>
  );
}
