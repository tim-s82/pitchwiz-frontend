import React from "react";
import { Pencil, Trash2, Calendar, X, Check } from "lucide-react";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";

export default function BookingEditModal({
  isOpen,
  onClose,
  editData,
  editForm,
  setEditForm,
  onSubmit,
  onDelete,
  saving,
  showDeleteConfirm,
  setShowDeleteConfirm,
}) {
  useLockBodyScroll(isOpen && Boolean(editData));

  if (!isOpen || !editData) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-xl rounded-2xl shadow-2xl border border-slate-800 max-h-[calc(100vh-2rem)] sm:max-h-[90vh] flex flex-col my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 px-5 sm:px-6 py-3.5 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Pencil size={15} className="text-slate-950 font-bold" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-slate-100">
                Edit Booking
              </h2>
              <p className="text-xxs sm:text-xs text-slate-400">
                Modify or cancel this pitch booking
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form
          onSubmit={onSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          {/* Scrollable Form Body */}
          <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Time Slot
              </label>
              <select
                value={editForm.timeSlot}
                onChange={(e) =>
                  setEditForm({ ...editForm, timeSlot: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-700/60 text-slate-100 text-sm rounded-xl px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="MORNING">Morning Slot</option>
                <option value="AFTERNOON">Afternoon Slot</option>
                <option value="EVENING">Evening Slot</option>
                <option value="ALL_DAY">All Day Slot</option>
              </select>
            </div>

            {/* Date Schedule */}
            <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Date Schedule
                </span>
                <label
                  htmlFor="editIsMultiDay"
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    id="editIsMultiDay"
                    checked={editForm.isMultiDay}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        isMultiDay: e.target.checked,
                        endDate: e.target.checked
                          ? editForm.endDate || editForm.date
                          : editForm.date,
                      })
                    }
                    className="rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-300">
                    Multi-Day Booking
                  </span>
                </label>
              </div>

              <div
                className={`grid gap-3 ${
                  editForm.isMultiDay ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                <div>
                  <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {editForm.isMultiDay ? "Start Date" : "Date"}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, date: e.target.value })
                      }
                      className="w-full px-3 py-2 pr-9 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                    <Calendar
                      size={16}
                      className="absolute right-3 text-emerald-500 pointer-events-none"
                    />
                  </div>
                </div>
                {editForm.isMultiDay && (
                  <div>
                    <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      End Date
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="date"
                        value={editForm.endDate}
                        min={editForm.date}
                        onChange={(e) =>
                          setEditForm({ ...editForm, endDate: e.target.value })
                        }
                        className="w-full px-3 py-2 pr-9 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                      <Calendar
                        size={16}
                        className="absolute right-3 text-emerald-500 pointer-events-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Teas and Drinks */}
            <div className="flex space-x-6 bg-slate-800/20 p-2.5 rounded-xl border border-slate-800/60 justify-around">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editForm.requiresTeas}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      requiresTeas: e.target.checked,
                    })
                  }
                  className="rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span className="text-xs sm:text-sm text-slate-200">
                  Request Teas
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editForm.requiresDrinks}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      requiresDrinks: e.target.checked,
                    })
                  }
                  className="rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span className="text-xs sm:text-sm text-slate-200">
                  Request Drinks
                </span>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Notes
              </label>
              <textarea
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                rows={2}
                className="w-full bg-slate-950 border border-slate-700/60 text-slate-100 text-sm rounded-xl px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
            </div>
          </div>

          {/* Pinned Action Buttons Footer */}
          <div className="p-4 sm:px-6 bg-slate-900/60 border-t border-slate-800/80 shrink-0">
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-red-400 font-semibold text-center">
                  Are you sure you want to cancel this booking? This cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold font-display border border-slate-700/60 hover:bg-slate-700 hover:text-slate-200 transition-all active:scale-[0.97] disabled:opacity-50"
                    disabled={saving}
                  >
                    Keep Booking
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-sm font-semibold font-display text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 hover:from-rose-500 hover:to-red-500 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                    <span>{saving ? "Cancelling…" : "Yes, Cancel It"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-800/60 bg-rose-950/30 hover:bg-rose-950/50 text-rose-400 text-sm font-semibold font-display transition-all active:scale-[0.97]"
                  title="Cancel this booking"
                  aria-label="Cancel this booking"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold font-display text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={16} />
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
