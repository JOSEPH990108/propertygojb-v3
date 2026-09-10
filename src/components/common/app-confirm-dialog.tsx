import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { confirmToneClassNames, type AppConfirmTone } from "@/lib/app-confirm";

const toneIcons: Record<AppConfirmTone, React.ReactNode> = {
  danger: <AlertTriangle className="size-7" />,
  warning: <AlertTriangle className="size-7" />,
  info: <Info className="size-7" />,
};

type AppConfirmDialogBodyProps = {
  tone: AppConfirmTone;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  isConfirming: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Shared confirmation dialog presentation used by both AppConfirmProvider and AppConfirmButton. */
export function AppConfirmDialogBody({
  tone,
  title,
  description,
  confirmText,
  cancelText,
  isConfirming,
  onCancel,
  onConfirm,
}: AppConfirmDialogBodyProps) {
  const toneClass = confirmToneClassNames[tone];

  return (
    <DialogContent className="max-w-md overflow-hidden rounded-[2rem] border border-white/40 p-0 sm:max-w-md">
      <div className="relative p-6">
        <div
          className={`grid size-14 place-items-center rounded-2xl ${toneClass.iconWrap}`}
        >
          {toneIcons[tone]}
        </div>

        <div className="mt-5">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${toneClass.badge}`}
          >
            Confirmation Required
          </span>

          <DialogTitle className="mt-4 text-2xl font-black tracking-tight text-slate-950">
            {title}
          </DialogTitle>

          <DialogDescription className="mt-3 text-sm leading-6 text-slate-500">
            {description}
          </DialogDescription>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isConfirming}
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isConfirming}
            aria-busy={isConfirming || undefined}
            onClick={onConfirm}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClass.confirmButton}`}
          >
            <CheckCircle2 className="size-4" />
            {isConfirming ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </DialogContent>
  );
}
