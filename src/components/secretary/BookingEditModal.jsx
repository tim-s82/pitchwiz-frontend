import React from "react";
import { Pencil, Trash2 } from "lucide-react";

export default function BookingEditModal({
  isOpen,
  booking,
  editForm,
  setEditForm,
  editSaving,
  showDeleteConfirm,
  setShowDeleteConfirm,
  onSubmit,
  onDelete,
  onClose,
  pitches,
  venues,
}) {
  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center">
              <Pencil size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-100">
                Edit Booking
              </h2>
              <p className="text-xs text-slate-400">
                Booking #{booking.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Pitch
            </label>
            <select
              value={editForm.pitchId}
              onChange={(e) =>
                setEditForm({ ...editForm, pitchId: e.target.value })
              }
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-blue-500"
            >
              {pitches.map((p) => (
                <option key={p.id} value={p.id}>
                  {venues.find((v) => v.id === p.venue)?.name} – {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Time Slot
            </label>
            <select
              value={editForm.timeSlot}
              onChange={(e) =>
                setEditForm({ ...editForm, timeSlot: e.target.value })
              }
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-blue-500"
            >
              <option value="MORNING">Morning</option>
              <option value="AFTERNOON">Afternoon</option>
              <option value="EVENING">Evening</option>
              <option value="ALL_DAY">All Day</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={editForm.date}
                onChange={(e) =>
                  setEditForm({ ...editForm, date: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="date"
                value={
                  editForm.isMultiDay ? editForm.endDate : editForm.date
                }
                disabled={!editForm.isMultiDay}
                onChange={(e) =>
                  setEditForm({ ...editForm, endDate: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editForm.isMultiDay}
              onChange={(e) =>
                setEditForm({ ...editForm, isMultiDay: e.target.checked })
              }
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-slate-300">
              Multi-day fixture
            </span>
          </label>

          <div className="flex space-x-4">
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
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm text-slate-200">Teas</span>
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
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm text-slate-200">Drinks</span>
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
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-blue-500"
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
                  disabled={editSaving}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={editSaving}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold transition flex items-center justify-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>
                    {editSaving ? "Cancelling…" : "Yes, Cancel It"}
                  </span>
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
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold transition"
              >
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
