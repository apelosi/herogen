import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authService } from "../services/auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await authService.getCurrentUser();
        if (!cancelled) navigate("/dashboard", { replace: true });
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Authentication failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
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

