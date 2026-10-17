import React, { useState, useEffect } from "react";
import { api } from "../services/api";

export default function Footer() {
  const [backendInfo, setBackendInfo] = useState(null);
  const [backendError, setBackendError] = useState(false);

  const frontendVersion = import.meta.env.VITE_APP_VERSION || "1.0.0";
  const frontendBuildDate =
    import.meta.env.VITE_BUILD_DATE || new Date().toISOString().split("T")[0];

  useEffect(() => {
    let isMounted = true;
    api
      .getVersion()
      .then((data) => {
        if (isMounted) {
          setBackendInfo(data);
          setBackendError(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn("Failed to fetch backend version:", err);
          setBackendError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-5 px-6 text-xs text-slate-500">
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
        <span>
          &copy; 2026 PitchWiz. Designed for cricket club match efficiency.
        </span>

        <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1 font-mono text-[11px] text-slate-500">
          <span
            className="flex items-center gap-1.5"
            title={`Frontend Client: v${frontendVersion} (${frontendBuildDate})`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>
            <span>
              UI:{" "}
              <span className="text-slate-300 font-medium">v{frontendVersion}</span>{" "}
              <span className="text-slate-500">({frontendBuildDate})</span>
            </span>
          </span>

          <span className="text-slate-800 hidden sm:inline">•</span>

          <span
            className="flex items-center gap-1.5"
            title={
              backendInfo
                ? `Backend API: v${backendInfo.version} (${backendInfo.build_date})${backendInfo.commit ? ` [${backendInfo.commit}]` : ""}`
                : backendError
                  ? "Backend API unreachable"
                  : "Connecting to API..."
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendInfo
                  ? "bg-emerald-500/80"
                  : backendError
                    ? "bg-rose-500/80"
                    : "bg-amber-500/80 animate-pulse"
              }`}
            ></span>
            <span>
              API:{" "}
              {backendInfo ? (
                <>
                  <span className="text-slate-300 font-medium">
                    v{backendInfo.version}
                  </span>{" "}
                  <span className="text-slate-500">({backendInfo.build_date})</span>
                </>
              ) : backendError ? (
                <span className="text-rose-400">offline</span>
              ) : (
                <span className="text-slate-600">connecting...</span>
              )}
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
