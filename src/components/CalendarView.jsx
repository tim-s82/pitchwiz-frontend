import React from "react";
import GroundMaintenanceModal from "./GroundMaintenanceModal";
import { useCalendarState } from "./calendar/useCalendarState";
import { useConflictDetection } from "./calendar/useConflictDetection";
import CalendarToolbar from "./calendar/CalendarToolbar";
import CellContent from "./calendar/CellContent";
import BookingCreateModal from "./calendar/BookingCreateModal";
import BookingEditModal from "./calendar/BookingEditModal";

export default function CalendarView({
  venues,
  pitches,
  teams,
  fixtures,
  bookings,
  pitchLengths,
  onBookingCreated,
  onBookingUpdated,
  onBookingDeleted,
  currentUser,
}) {
  const {
    selectedVenueId,
    setSelectedVenueId,
    selectedTeamId,
    setSelectedTeamId,
    selectedStatus,
    setSelectedStatus,
    viewMode,
    setViewMode,
    mobileLayoutMode,
    setMobileLayoutMode,
    mobileSelectedDateStr,
    mobileSelectedPitchId,
    setMobileSelectedPitchId,
    startDateStr,
    isModalOpen,
    setIsModalOpen,
    modalData,
    setModalData,
    isMaintenanceModalOpen,
    setIsMaintenanceModalOpen,
    maintenanceData,
    setMaintenanceData,
    isEditModalOpen,
    setIsEditModalOpen,
    editData,
    setEditData,
    editForm,
    setEditForm,
    editSaving,
    setEditSaving,
    showDeleteConfirm,
    setShowDeleteConfirm,
    sortedVenues,
    sortedTeams,
    filteredTeam,
    filteredPitches,
    datesList,
    shiftWeek,
    shiftMobileDay,
    allowedTeams,
    isExternalUser,
    isOnlyGroundstaff,
  } = useCalendarState({
    venues,
    pitches,
    teams,
    currentUser,
  });

  const { getCellStatus, canEditBooking } = useConflictDetection({
    bookings,
    pitches,
    fixtures,
    teams,
    selectedStatus,
    currentUser,
    isExternalUser,
  });

  const handleCellClick = (pitchId, dateStr, timeSlot, existingCell) => {
    if (existingCell) {
      if (existingCell.type === "BLOCKED") {
        alert(
          existingCell.reason ||
            "This slot is blocked due to an outfield overlap."
        );
        return;
      }

      if (existingCell.type === "BOOKED") {
        const b = existingCell.booking;
        if (canEditBooking(b)) {
          const fix = b.fixture ? fixtures.find((f) => f.id === b.fixture) : null;
          setEditData(b);
          setEditForm({
            pitchId: b.pitch.toString(),
            timeSlot: b.time_slot,
            date: b.start_date || b.date,
            endDate: b.end_date || b.start_date || b.date,
            isMultiDay: (b.start_date || b.date) !== (b.end_date || b.start_date || b.date),
            opponent: fix?.opponent || b.external_contact_name || "",
            requiresTeas: b.requires_teas,
            requiresDrinks: b.requires_drinks,
            notes: b.notes || "",
          });
          setShowDeleteConfirm(false);
          setIsEditModalOpen(true);
        } else {
          alert(
            `Booking Details:\nStatus: ${b.status}\nNotes: ${b.notes || "None"}`
          );
        }
        return;
      }

      if (existingCell.type === "PENDING_MULTI") {
        if (isExternalUser) {
          alert("This slot has pending requests. External users cannot create bookings directly.");
          return;
        }
        if (isOnlyGroundstaff) {
          setMaintenanceData({
            pitchId: pitchId.toString(),
            date: dateStr,
            timeSlot,
            notes: "",
            isMultiDay: false,
            endDate: dateStr,
          });
          setIsMaintenanceModalOpen(true);
          return;
        }
        setModalData({
          pitchId: pitchId.toString(),
          date: dateStr,
          timeSlot,
          teamId: selectedTeamId !== "all" ? selectedTeamId : "",
          opponent: "",
          requiresTeas: false,
          requiresDrinks: false,
          notes: "",
          isMultiDay: false,
          endDate: dateStr,
        });
        setIsModalOpen(true);
        return;
      }
    }

    if (isExternalUser) {
      alert("External users cannot create bookings directly.");
      return;
    }

    if (isOnlyGroundstaff) {
      setMaintenanceData({
        pitchId: pitchId.toString(),
        date: dateStr,
        timeSlot,
        notes: "",
        isMultiDay: false,
        endDate: dateStr,
      });
      setIsMaintenanceModalOpen(true);
      return;
    }

    setModalData({
      pitchId: pitchId.toString(),
      date: dateStr,
      timeSlot,
      teamId: selectedTeamId !== "all" ? selectedTeamId : "",
      opponent: "",
      requiresTeas: false,
      requiresDrinks: false,
      notes: "",
      isMultiDay: false,
      endDate: dateStr,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (
      !modalData.pitchId ||
      !modalData.date ||
      !modalData.teamId ||
      !modalData.opponent
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    const payload = {
      pitch: parseInt(modalData.pitchId, 10),
      start_date: modalData.date,
      end_date: modalData.isMultiDay ? modalData.endDate : modalData.date,
      time_slot: modalData.timeSlot,
      requires_teas: modalData.requiresTeas,
      requires_drinks: modalData.requiresDrinks,
      notes: modalData.notes,
      fixture_team: parseInt(modalData.teamId, 10),
      fixture_opponent: modalData.opponent,
    };

    try {
      await onBookingCreated(payload);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(`Failed to submit request:\n${err.message}`);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      await onBookingUpdated(editData.id, {
        pitch: parseInt(editForm.pitchId || editData.pitch, 10),
        time_slot: editForm.timeSlot,
        start_date: editForm.date,
        end_date: editForm.isMultiDay ? editForm.endDate : editForm.date,
        requires_teas: editForm.requiresTeas,
        requires_drinks: editForm.requiresDrinks,
        notes: editForm.notes,
      });
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(`Failed to save changes:\n${err.message}`);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteBooking = async () => {
    setEditSaving(true);
    try {
      await onBookingDeleted(editData.id);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(`Failed to cancel booking:\n${err.message}`);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header with Controls & Filters */}
      <CalendarToolbar
        startDateStr={startDateStr}
        onShiftWeek={shiftWeek}
        sortedVenues={sortedVenues}
        selectedVenueId={selectedVenueId}
        setSelectedVenueId={setSelectedVenueId}
        sortedTeams={sortedTeams}
        selectedTeamId={selectedTeamId}
        setSelectedTeamId={setSelectedTeamId}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
        mobileLayoutMode={mobileLayoutMode}
        setMobileLayoutMode={setMobileLayoutMode}
        filteredTeam={filteredTeam}
        pitchLengths={pitchLengths}
      />

      {/* MOBILE RESPONSIVE VIEWS */}
      <div className="block md:hidden space-y-4">
        {mobileLayoutMode === "singleDay" ? (
          <div className="glass-panel p-4 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => shiftMobileDay(-1)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700"
              >
                ←
              </button>
              <div className="text-sm font-bold text-slate-100 font-display">
                {new Date(mobileSelectedDateStr).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              <button
                onClick={() => shiftMobileDay(1)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700"
              >
                →
              </button>
            </div>

            <div className="space-y-3">
              {filteredPitches.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No compatible pitches found.
                </div>
              ) : (
                filteredPitches.map((pitch) => {
                  const venueName =
                    venues.find((v) => v.id === pitch.venue)?.name || "";
                  return (
                    <div
                      key={pitch.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <div>
                          <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                            {venueName}
                          </span>
                          <h4 className="text-sm font-bold text-slate-100">
                            {pitch.name}
                          </h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {["MORNING", "AFTERNOON", "EVENING"].map((slot) => {
                          const cell = getCellStatus(
                            pitch.id,
                            mobileSelectedDateStr,
                            slot
                          );
                          return (
                            <div key={slot} className="space-y-1">
                              <span className="text-[10px] text-slate-400 font-semibold block text-center uppercase">
                                {slot.slice(0, 3)}
                              </span>
                              <CellContent
                                cell={cell}
                                onClick={() =>
                                  handleCellClick(
                                    pitch.id,
                                    mobileSelectedDateStr,
                                    slot,
                                    cell
                                  )
                                }
                                compact={true}
                                isExternal={isExternalUser}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel p-4 rounded-2xl space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Select Pitch
              </label>
              <select
                value={mobileSelectedPitchId}
                onChange={(e) => setMobileSelectedPitchId(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl py-2 px-3 outline-none border border-slate-700"
              >
                {filteredPitches.map((p) => (
                  <option key={p.id} value={p.id}>
                    {venues.find((v) => v.id === p.venue)?.name} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <button
                onClick={() => shiftWeek(-1)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition flex items-center space-x-1 text-xs font-semibold"
              >
                <span>← Prev Week</span>
              </button>
              <div className="text-xs font-bold text-slate-100 font-display">
                Week of{" "}
                {new Date(startDateStr).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
              <button
                onClick={() => shiftWeek(1)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition flex items-center space-x-1 text-xs font-semibold"
              >
                <span>Next Week →</span>
              </button>
            </div>

            <div className="space-y-3">
              {datesList.map((day) => (
                <div
                  key={day.isoStr}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2"
                >
                  <h4 className="text-xs font-bold text-emerald-400 border-b border-slate-800 pb-1 font-display">
                    {day.label}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {["MORNING", "AFTERNOON", "EVENING"].map((slot) => {
                      const cell = getCellStatus(
                        parseInt(mobileSelectedPitchId, 10),
                        day.isoStr,
                        slot
                      );
                      return (
                        <div key={slot} className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-semibold block text-center uppercase">
                            {slot.slice(0, 3)}
                          </span>
                          <CellContent
                            cell={cell}
                            onClick={() =>
                              handleCellClick(
                                parseInt(mobileSelectedPitchId, 10),
                                day.isoStr,
                                slot,
                                cell
                              )
                            }
                            compact={true}
                            isExternal={isExternalUser}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP CALENDAR MATRIX */}
      <div className="hidden md:block glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          {viewMode === "transposed" ? (
            <table className="w-full table-fixed border-collapse text-left min-w-[900px]">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-850">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-56 font-display border-r border-slate-800 shrink-0">
                    Day & Session
                  </th>
                  {filteredPitches.map((pitch) => {
                    const venueName =
                      venues.find((v) => v.id === pitch.venue)?.name || "";
                    return (
                      <th
                        key={pitch.id}
                        className="p-4 text-center border-r border-slate-800 last:border-r-0 truncate"
                      >
                        <span className="text-xs text-emerald-400 block font-display tracking-wide truncate">
                          {venueName}
                        </span>
                        <span className="block text-sm font-semibold text-slate-100 truncate">
                          {pitch.name}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredPitches.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-12 text-center text-slate-400">
                      No compatible pitches found. Try clearing filters.
                    </td>
                  </tr>
                ) : (
                  datesList.map((day) => (
                    <React.Fragment key={day.isoStr}>
                      <tr className="bg-slate-900/90 border-t-4 border-b-2 border-emerald-500/40">
                        <td
                          colSpan={filteredPitches.length + 1}
                          className="px-4 py-2 text-emerald-400 font-bold font-display text-sm tracking-wide bg-slate-900/90"
                        >
                          {day.label}
                        </td>
                      </tr>
                      {["MORNING", "AFTERNOON", "EVENING"].map((slot) => (
                        <tr key={slot} className="border-b border-slate-800/30 hover:bg-slate-800/10">
                          <td className="px-3 py-1.5 border-r border-slate-800 font-medium bg-slate-950/40">
                            <span className="text-xs text-slate-300 font-semibold block capitalize">
                              {slot.toLowerCase()}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {slot === "MORNING" && "09:00 - 13:00"}
                              {slot === "AFTERNOON" && "13:30 - 18:00"}
                              {slot === "EVENING" && "18:00 - 21:00"}
                            </span>
                          </td>
                          {filteredPitches.map((pitch) => {
                            const cell = getCellStatus(
                              pitch.id,
                              day.isoStr,
                              slot
                            );
                            return (
                              <td
                                key={pitch.id}
                                className="p-1 border-r border-slate-800/40 last:border-r-0 align-top"
                              >
                                <CellContent
                                  cell={cell}
                                  onClick={() =>
                                    handleCellClick(
                                      pitch.id,
                                      day.isoStr,
                                      slot,
                                      cell
                                    )
                                  }
                                  compact={true}
                                  isExternal={isExternalUser}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full table-fixed border-collapse text-left min-w-[900px]">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-850">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-56 font-display border-r border-slate-800 shrink-0">
                    Session / Pitch
                  </th>
                  {datesList.map((day) => (
                    <th
                      key={day.isoStr}
                      className="p-4 text-center border-r border-slate-800 last:border-r-0 truncate"
                    >
                      <span className="block text-sm font-semibold text-slate-200 truncate">
                        {day.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPitches.length === 0 ? (
                  <tr>
                    <td
                      colSpan={datesList.length + 1}
                      className="p-12 text-center text-slate-400"
                    >
                      No compatible pitches found. Try clearing filters.
                    </td>
                  </tr>
                ) : (
                  filteredPitches.map((pitch) => {
                    const venueName =
                      venues.find((v) => v.id === pitch.venue)?.name || "";
                    return (
                      <React.Fragment key={pitch.id}>
                        <tr className="bg-slate-900/90 border-t-4 border-b-2 border-emerald-500/40">
                          <td
                            colSpan={datesList.length + 1}
                            className="px-4 py-2 font-display bg-slate-900/90"
                          >
                            <span className="text-xs text-emerald-400 font-bold tracking-wide mr-2">
                              {venueName}
                            </span>
                            <span className="text-sm font-bold text-slate-100">
                              {pitch.name}
                            </span>
                          </td>
                        </tr>

                        {["MORNING", "AFTERNOON", "EVENING"].map((slot) => (
                          <tr key={slot} className="border-b border-slate-800/30 hover:bg-slate-800/10">
                            <td className="px-3 py-1.5 border-r border-slate-800 font-medium bg-slate-950/40">
                              <span className="text-xs text-slate-300 font-semibold block capitalize">
                                {slot.toLowerCase()}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {slot === "MORNING" && "09:00 - 13:00"}
                                {slot === "AFTERNOON" && "13:30 - 18:00"}
                                {slot === "EVENING" && "18:00 - 21:00"}
                              </span>
                            </td>
                            {datesList.map((day) => {
                              const cell = getCellStatus(
                                pitch.id,
                                day.isoStr,
                                slot
                              );
                              return (
                                <td
                                  key={day.isoStr}
                                  className="p-1 border-r border-slate-800/40 last:border-r-0 align-top"
                                >
                                  <CellContent
                                    cell={cell}
                                    onClick={() =>
                                      handleCellClick(
                                        pitch.id,
                                        day.isoStr,
                                        slot,
                                        cell
                                      )
                                    }
                                    compact={true}
                                    isExternal={isExternalUser}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalData={modalData}
        setModalData={setModalData}
        pitches={pitches}
        venues={venues}
        teams={teams}
        allowedTeams={allowedTeams}
        currentUser={currentUser}
        onSubmit={handleFormSubmit}
      />

      <GroundMaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        initialData={maintenanceData}
        pitches={pitches}
        venues={venues}
        onSuccess={onBookingCreated}
      />

      {/* Edit / Cancel Booking Modal */}
      <BookingEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editData={editData}
        editForm={editForm}
        setEditForm={setEditForm}
        onSubmit={handleEditSubmit}
        onDelete={handleDeleteBooking}
        saving={editSaving}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
      />
    </div>
  );
}