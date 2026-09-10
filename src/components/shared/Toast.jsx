import React from "react";
import { AlertTriangle, Check } from "lucide-react";

export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-3 ${
        toast.type === "error"
          ? "bg-rose-500 text-white shadow-rose-500/20"
          : "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
      }`}
    >
      {toast.type === "error" ? <AlertTriangle size={18} /> : <Check size={18} />}
      <span>{toast.message}</span>
    </div>
  );
}
