import React from "react";
import { Calendar } from "lucide-react";

export default function BookingCreateModal({
  isOpen,
  onClose,
  modalData,
  setModalData,
  pitches,
  venues,
  teams,
  allowedTeams,
  currentUser,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold font-display text-slate-100">
            Request Pitch Booking
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Pitch
              </label>
              <select
                value={modalData.pitchId}
                onChange={(e) => {
                  const newPitchId = e.target.value;
                  let updatedTeamId = modalData.teamId;
                  if (newPitchId && modalData.teamId) {
                    const newPitch = pitches.find(
                      (p) => p.id === parseInt(newPitchId, 10)
                    );
                    const currentTeam = teams.find(
                      (t) => t.id === parseInt(modalData.teamId, 10)
                    );
                    if (
                      newPitch &&
                      currentTeam &&
                      currentTeam.required_length &&
                      !newPitch.supported_lengths.includes(
                        currentTeam.required_length
                      )
                    ) {
                      updatedTeamId = "";
                    }
                  }
                  setModalData({
                    ...modalData,
                    pitchId: newPitchId,
                    teamId: updatedTeamId,
                  });
                }}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                required
              >
                <option value="">Select Pitch</option>
                {pitches.map((p) => (
                  <option key={p.id} value={p.id}>
                    {venues.find((v) => v.id === p.venue)?.name} - {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Time Slot
              </label>
              <select
                value={modalData.timeSlot}
                onChange={(e) =>
                  setModalData({ ...modalData, timeSlot: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
              >
                <option value="MORNING">Morning Slot</option>
                <option value="AFTERNOON">Afternoon Slot</option>
                <option value="EVENING">Evening Slot</option>
                <option value="ALL_DAY">All Day Slot</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Team (Requesting)
            </label>
            <select
              value={modalData.teamId}
              onChange={(e) =>
                setModalData({ ...modalData, teamId: e.target.value })
              }
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
              required
            >
              <option value="">Select Team</option>
              {allowedTeams
                .filter((t) => {
                  const hasAdminOrSec =
                    currentUser?.roles?.includes("ADMIN") ||
                    currentUser?.roles?.includes("FIXTURE_SECRETARY");
                  if (!hasAdminOrSec && t.is_external) return false;

                  if (modalData.pitchId) {
                    const selectedPitch = pitches.find(
                      (p) => p.id === parseInt(modalData.pitchId, 10)
                    );
                    if (
                      selectedPitch &&
                      t.required_length &&
                      !selectedPitch.supported_lengths.includes(
                        t.required_length
                      )
                    ) {
                      return false;
                    }
                  }
                  return true;
                })
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.is_external ? "(External)" : ""}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Opponent
            </label>
            <input
              type="text"
              value={modalData.opponent}
              onChange={(e) =>
                setModalData({ ...modalData, opponent: e.target.value })
              }
              placeholder="e.g. Broadstone CC"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="bg-slate-800/40 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isMultiDay"
                  checked={modalData.isMultiDay}
                  onChange={(e) =>
                    setModalData({
                      ...modalData,
                      isMultiDay: e.target.checked,
                      endDate: e.target.checked
                        ? modalData.endDate || modalData.date
                        : modalData.date,
                    })
                  }
                  className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                />
                <label
                  htmlFor="isMultiDay"
                  className="text-sm font-medium text-slate-200"
                >
                  Multi-Day Booking
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {modalData.isMultiDay ? "Start Date" : "Date"}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={modalData.date}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        date: e.target.value,
                        endDate: modalData.isMultiDay
                          ? modalData.endDate
                          : e.target.value,
                      })
                    }
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <Calendar
                    size={18}
                    className="absolute right-3.5 text-emerald-500 pointer-events-none"
                  />
                </div>
              </div>
              {modalData.isMultiDay && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={modalData.endDate}
                      min={modalData.date}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          endDate: e.target.value,
                        })
                      }
                      required
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
                checked={modalData.requiresTeas}
                onChange={(e) =>
                  setModalData({
                    ...modalData,
                    requiresTeas: e.target.checked,
                  })
                }
                className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-200">Request Teas</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={modalData.requiresDrinks}
                onChange={(e) =>
                  setModalData({
                    ...modalData,
                    requiresDrinks: e.target.checked,
                  })
                }
                className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-200">Request Drinks</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Notes for Secretary
            </label>
            <textarea
              value={modalData.notes}
              onChange={(e) =>
                setModalData({ ...modalData, notes: e.target.value })
              }
              placeholder="Any special ground prep, cup rules, etc."
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg transition"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}