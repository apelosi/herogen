import { useEffect } from "react";

export type ToastType = "error" | "success" | "info";

export type ToastState = {
  open: boolean;
  message: string;
  type: ToastType;
};

export function Toast({
  toast,
  onClose,
  autoHideMs = 5000,
}: {
  toast: ToastState;
  onClose: () => void;
  autoHideMs?: number;
}) {
  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(onClose, autoHideMs);
    return () => clearTimeout(t);
  }, [toast.open, autoHideMs, onClose]);

  if (!toast.open) return null;

  const colors =
    toast.type === "error"
      ? "border-red-200 bg-red-50 text-red-900"
      : toast.type === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : "border-slate-200 bg-white text-slate-900";

  return (
    <div className="fixed top-4 right-4 z-[9999] w-[min(420px,calc(100vw-2rem))]">
      <div className={`rounded-2xl border shadow-xl px-4 py-3 ${colors}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="font-black tracking-tight">{toast.message}</div>
          <button
            onClick={onClose}
            className="text-xs font-black uppercase tracking-widest opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

