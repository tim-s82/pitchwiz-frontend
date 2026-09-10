import React from "react";
import { Plus, ShieldAlert, Shovel } from "lucide-react";

export default function CellContent({ cell, onClick, compact = false, isExternal = false }) {
  const heightClass = compact ? "h-16" : "h-24";

  if (!cell) {
    if (isExternal) {
      return (
        <div
          className={`w-full ${heightClass} border border-slate-900 rounded-xl bg-slate-950/40 flex items-center justify-center`}
        >
          <span className="text-[10px] text-emerald-500/70 font-semibold font-display">
            Available
          </span>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full ${heightClass} flex items-center justify-center border border-dashed border-slate-800 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-950/25 group transition cursor-pointer overflow-hidden`}
      >
        <Plus
          size={14}
          className="text-slate-500 group-hover:text-emerald-400 group-hover:scale-110 transition duration-300 pointer-events-none"
        />
      </button>
    );
  }

  if (cell.type === "BLOCKED") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full ${heightClass} text-left bg-slate-900/60 border border-slate-800 rounded-xl ${
          compact ? "p-1.5" : "p-2.5"
        } flex flex-col justify-between overflow-hidden cursor-pointer hover:border-slate-700 transition`}
        title={isExternal ? "Unavailable" : cell.reason}
      >
        <div className="flex items-start space-x-1 text-slate-500 pointer-events-none">
          <ShieldAlert size={12} className="shrink-0 text-amber-600 mt-0.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider font-display line-clamp-2">
            {isExternal ? "Unavailable" : cell.label}
          </span>
        </div>
        {!compact && !isExternal && (
          <span className="text-[10px] text-slate-500 leading-snug line-clamp-1 pointer-events-none">
            Outfield Overlap
          </span>
        )}
      </button>
    );
  }

  if (cell.type === "PENDING_MULTI") {
    const count = cell.pendingItems.length;
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full ${heightClass} text-left cursor-pointer border rounded-xl ${
          compact ? "p-1.5" : "p-2"
        } flex flex-col justify-between overflow-hidden transition-all duration-300 bg-violet-950/25 border-violet-900/60 hover:border-violet-500/70 hover:bg-violet-950/40 group`}
      >
        <div className="pointer-events-none w-full space-y-0.5 overflow-hidden">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase font-display bg-violet-900/50 text-violet-300 flex items-center gap-1 truncate">
              {count} Pending
            </span>
            {!isExternal && (
              <span className="text-[9px] text-emerald-400/70 group-hover:text-emerald-400 font-semibold transition shrink-0">
                + Request
              </span>
            )}
          </div>
          {cell.pendingItems.slice(0, compact ? 1 : 2).map(({ booking, label }) => (
            <p key={booking.id} className="text-[10px] text-slate-400 truncate leading-tight">
              {isExternal ? "Pending" : label}
            </p>
          ))}
          {count > (compact ? 1 : 2) && (
            <p className="text-[10px] text-slate-500 leading-tight">
              +{count - (compact ? 1 : 2)} more…
            </p>
          )}
        </div>
      </button>
    );
  }

  const isApproved = cell.status === "APPROVED";
  const isMaintenance = cell.isMaintenance;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full ${heightClass} text-left cursor-pointer border rounded-xl ${
        compact ? "p-1.5" : "p-2.5"
      } flex flex-col justify-between overflow-hidden transition-all duration-300 ${
        isMaintenance
          ? "bg-amber-950/40 border-amber-800/80 hover:border-amber-500 shadow-sm"
          : isApproved
            ? "bg-emerald-950/30 border-emerald-900/80 hover:border-blue-500 shadow-sm"
            : "bg-amber-950/20 border-amber-900/50 hover:border-blue-500"
      }`}
    >
      <div className="pointer-events-none w-full">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          {isMaintenance ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase font-display truncate bg-amber-900/60 text-amber-300 flex items-center gap-1">
              <Shovel size={10} />
              Maintenance
            </span>
          ) : (
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase font-display truncate ${
                isApproved
                  ? "bg-emerald-900/50 text-emerald-400"
                  : "bg-amber-900/50 text-amber-400"
              }`}
            >
              {isApproved ? "Booked" : "Pending"}
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-slate-300 line-clamp-2 leading-tight">
          {isExternal && !isMaintenance ? "Booked" : cell.label}
        </p>
      </div>

      {!compact && !isExternal && cell.booking?.notes && !isMaintenance && (
        <span className="text-[10px] text-slate-400 line-clamp-1 italic pointer-events-none">
          "{cell.booking.notes}"
        </span>
      )}
    </button>
  );
}
