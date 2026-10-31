import React, { useMemo } from "react";
import { Calendar, X, Dumbbell, Users } from "lucide-react";

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
  const sortedPitches = useMemo(() => {
    const rank =
      modalData.bookingType === "TRAINING"
        ? { net: 1, outfield: 2, youth: 3, main: 4 } // training: nets first
        : { main: 1, youth: 2, outfield: 3, net: 4 }; // fixture: main first
    return [...pitches].sort(
      (a, b) =>
        (rank[(a.entity_type || "").toLowerCase()] || 99) -
        (rank[(b.entity_type || "").toLowerCase()] || 99)
    );
  }, [pitches, modalData.bookingType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold font-display text-slate-100">
            {modalData.bookingType === "TRAINING"
              ? "Request Training Session"
              : "Request Pitch Booking"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Booking Type Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-700 mb-2">
            {[
              { value: "FIXTURE", label: "Fixture", Icon: Calendar },
              { value: "TRAINING", label: "Training Session", Icon: Dumbbell },
            ].map(({ value, label, Icon }) => {
              const active = modalData.bookingType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setModalData({
                      ...modalData,
                      bookingType: value,
                      teamId: "",
                      opponent: "",
                      trainingTeamIds: [],
                    })
                  }
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold font-display transition-colors ${
                    active
                      ? "bg-emerald-600/80 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>

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
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                required
              >
                <option value="">Select Pitch</option>
                {sortedPitches.map((p) => (
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
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="MORNING">Morning Slot</option>
                <option value="AFTERNOON">Afternoon Slot</option>
                <option value="EVENING">Evening Slot</option>
                <option value="ALL_DAY">All Day Slot</option>
              </select>
            </div>
          </div>

          {modalData.bookingType === "FIXTURE" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Team (Requesting)
                </label>
                <select
                  value={modalData.teamId}
                  onChange={(e) =>
                    setModalData({ ...modalData, teamId: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </>
          )}

          {modalData.bookingType === "TRAINING" && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Invited Teams
              </label>
              <div className="flex flex-wrap gap-2">
                {/* Club-wide pill — Admin/Secretary only */}
                {(currentUser?.roles?.includes("ADMIN") ||
                  currentUser?.roles?.includes("FIXTURE_SECRETARY")) && (
                  <button
                    type="button"
                    onClick={() =>
                      setModalData({ ...modalData, trainingTeamIds: [] })
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                      modalData.trainingTeamIds.length === 0
                        ? "bg-teal-500/20 text-teal-400 border-teal-500/40"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <Users size={13} />
                    Club-wide
                  </button>
                )}

                {/* Individual team pills */}
                {allowedTeams
                  .filter((t) => !t.is_external)
                  .map((t) => {
                    const isSelected = modalData.trainingTeamIds.includes(t.id);
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => {
                          const next = isSelected
                            ? modalData.trainingTeamIds.filter((id) => id !== t.id)
                            : [...modalData.trainingTeamIds, t.id];
                          setModalData({ ...modalData, trainingTeamIds: next });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

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

          {modalData.bookingType === "FIXTURE" && (
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
          )}

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
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold font-display border border-slate-700/60 hover:bg-slate-700 hover:text-slate-200 transition-all active:scale-[0.97]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold font-display text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-[0.97]"
            >
              {modalData.bookingType === "TRAINING" ? (
                <Dumbbell size={16} />
              ) : (
                <Calendar size={16} />
              )}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}