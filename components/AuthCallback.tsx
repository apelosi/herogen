import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authService } from "../services/auth";
import { Toast, ToastState } from "./Toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    type: "info",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await authService.getCurrentUser();
        if (!cancelled) navigate("/dashboard", { replace: true });
      } catch (e: any) {
        if (!cancelled) {
          const msg = e?.message ?? "Authentication failed";
          setError(msg);
          setToast({ open: true, message: msg, type: "error" });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <Toast toast={toast} onClose={() => setToast((t) => ({ ...t, open: false }))} />
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-6">
          <div className="text-slate-900 font-black text-xl uppercase tracking-tight">
            Login failed
          </div>
          <p className="text-slate-600 mt-3">{error}</p>
          <button
            onClick={() => navigate("/", { replace: true })}
            className="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-widest"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-indigo-600 font-black uppercase tracking-widest">
        Signing you in...
      </div>
    </div>
  );
}

