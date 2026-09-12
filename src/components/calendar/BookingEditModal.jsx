import React from "react";
import { Pencil, Trash2, Calendar } from "lucide-react";

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
  if (!isOpen || !editData) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-800 max-h-[90vh] flex flex-col">
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Pencil size={16} className="text-slate-950 font-bold" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-100">
                Edit Booking
              </h2>
              <p className="text-xs text-slate-400">
                Modify or cancel this pitch booking
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="p-6 space-y-4 overflow-y-auto"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Time Slot
            </label>
            <select
              value={editForm.timeSlot}
              onChange={(e) =>
                setEditForm({ ...editForm, timeSlot: e.target.value })
              }
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
            >
              <option value="MORNING">Morning Slot</option>
              <option value="AFTERNOON">Afternoon Slot</option>
              <option value="EVENING">Evening Slot</option>
              <option value="ALL_DAY">All Day Slot</option>
            </select>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
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
                  className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500 w-4 h-4"
                />
                <label
                  htmlFor="editIsMultiDay"
                  className="text-sm font-medium text-slate-200 cursor-pointer"
                >
                  Multi-Day Booking
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {editForm.isMultiDay ? "Start Date" : "Date"}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) =>
                      setEditForm({ ...editForm, date: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <Calendar
                    size={18}
                    className="absolute right-3.5 text-emerald-500 pointer-events-none"
                  />
                </div>
              </div>
              {editForm.isMultiDay && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
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
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                    <Calendar
                      size={18}
                      className="absolute right-3.5 text-emerald-500 pointer-events-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-6 bg-slate-800/20 p-3.5 rounded-xl border border-slate-800/60 justify-around">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.requiresTeas}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    requiresTeas: e.target.checked,
                  })
                }
                className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-sm text-slate-200">Request Teas</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.requiresDrinks}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    requiresDrinks: e.target.checked,
                  })
                }
                className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-sm text-slate-200">Request Drinks</span>
            </label>
          </div>

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
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
            />
          </div>

          {showDeleteConfirm ? (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-red-400 font-semibold text-center">
                Are you sure you want to cancel this booking? This cannot be
                undone.
              </p>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                  disabled={saving}
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={saving}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold shadow-lg transition flex items-center justify-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>{saving ? "Cancelling…" : "Yes, Cancel It"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="py-3 px-4 rounded-xl border border-red-800 bg-red-950/30 hover:bg-red-950/60 text-red-400 font-semibold transition flex items-center space-x-2"
              >
                <Trash2 size={15} />
                <span>Cancel Booking</span>
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg transition"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}