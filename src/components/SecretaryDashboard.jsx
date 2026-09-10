import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  MapPin,
  Calendar,
  Clock,
  Coffee,
  Pencil,
} from "lucide-react";
import { useConflictDetection } from "./secretary/useConflictDetection";
import RejectModal from "./secretary/RejectModal";
import ConfirmApproveModal from "./secretary/ConfirmApproveModal";
import BookingEditModal from "./secretary/BookingEditModal";
import ChangeRequestsTab from "./secretary/ChangeRequestsTab";

export default function SecretaryDashboard({
  venues,
  pitches,
  teams,
  fixtures,
  bookings,
  pitchLengths,
  onBookingStatusUpdate,
  onBookingUpdated,
  onBookingDeleted,
}) {
  const [activeTab, setActiveTab] = useState("pending");
  const [altPitchId, setAltPitchId] = useState({});
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  // Rejection reason modal state
  const [rejectModal, setRejectModal] = useState({
    open: false,
    bookingId: null,
    reason: "",
  });

  // Confirm Approve modal state (shown when competing pending bookings exist)
  const [confirmApproveModal, setConfirmApproveModal] = useState({
    open: false,
    booking: null,
    competingBookings: [],
    isSubmitting: false,
  });

  // Edit modal state
  const [editModal, setEditModal] = useState({ open: false, booking: null });
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { detectCompetingPending, detectConflicts } = useConflictDetection({
    bookings,
    pitches,
    fixtures,
    teams,
    pitchLengths,
  });

  const pendingBookings = useMemo(() => {
    return bookings.filter((b) => b.status === "PENDING");
  }, [bookings]);

  const resolvedBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.status === "APPROVED" || b.status === "DENIED",
    );
  }, [bookings]);

  const handleApprove = (id) => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;
    const competing = detectCompetingPending(booking);
    if (competing.length > 0) {
      setConfirmApproveModal({
        open: true,
        booking,
        competingBookings: competing,
        isSubmitting: false,
      });
    } else {
      onBookingStatusUpdate(id, "APPROVED");
    }
  };

  const confirmApproval = async () => {
    const { booking, competingBookings } = confirmApproveModal;
    setConfirmApproveModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      // 1. Approve the chosen booking
      await onBookingStatusUpdate(booking.id, "APPROVED");

      // 2. Auto-reject all competing pending bookings
      await Promise.all(
        competingBookings.map((cb) =>
          onBookingStatusUpdate(
            cb.id,
            "DENIED",
            "Auto-rejected: a competing request for this slot was approved by the Fixture Secretary.",
          ),
        ),
      );
    } catch (e) {
      console.error("Error during approval/auto-rejection:", e);
    } finally {
      setConfirmApproveModal({
        open: false,
        booking: null,
        competingBookings: [],
        isSubmitting: false,
      });
    }
  };

  const handleDeny = (id) => {
    setRejectModal({ open: true, bookingId: id, reason: "" });
  };

  const submitDenial = async () => {
    if (!rejectModal.reason.trim()) {
      alert("A rejection reason is required.");
      return;
    }
    try {
      await onBookingStatusUpdate(
        rejectModal.bookingId,
        "DENIED",
        rejectModal.reason,
      );
      setRejectModal({ open: false, bookingId: null, reason: "" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleProposeAlternative = async (bookingId, newPitchId) => {
    if (!newPitchId) return;
    try {
      await onBookingUpdated(bookingId, { pitch: parseInt(newPitchId, 10) });
      alert("Pitch updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to move pitch: " + e.message);
    }
  };

  const handleEditBooking = (booking) => {
    setEditForm({
      pitchId: booking.pitch.toString(),
      timeSlot: booking.time_slot,
      date: booking.start_date,
      endDate: booking.end_date,
      isMultiDay: booking.start_date !== booking.end_date,
      requiresTeas: booking.requires_teas,
      requiresDrinks: booking.requires_drinks,
      notes: booking.notes || "",
    });
    setShowDeleteConfirm(false);
    setEditModal({ open: true, booking });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      await onBookingUpdated(editModal.booking.id, {
        pitch: parseInt(editForm.pitchId, 10),
        time_slot: editForm.timeSlot,
        start_date: editForm.date,
        end_date: editForm.isMultiDay ? editForm.endDate : editForm.date,
        requires_teas: editForm.requiresTeas,
        requires_drinks: editForm.requiresDrinks,
        notes: editForm.notes,
      });
      setEditModal({ open: false, booking: null });
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
      await onBookingDeleted(editModal.booking.id);
      setEditModal({ open: false, booking: null });
    } catch (err) {
      console.error(err);
      alert(`Failed to cancel booking:\n${err.message}`);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-slate-100">
              Fixture Secretary Dashboard
            </h2>
            <p className="text-sm text-slate-400">
              Review pitch booking requests, resolve overlaps, and manage
              allocations.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-4 px-6 font-semibold text-sm transition-all duration-300 relative ${
            activeTab === "pending"
              ? "text-emerald-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Pending Requests
          {pendingBookings.length > 0 && (
            <span className="ml-2 bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 text-xs rounded-full">
              {pendingBookings.length}
            </span>
          )}
          {activeTab === "pending" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("changes")}
          className={`pb-4 px-6 font-semibold text-sm transition-all duration-300 relative ${
            activeTab === "changes"
              ? "text-emerald-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Change Requests
          {pendingChangesCount > 0 && (
            <span className="ml-2 bg-indigo-500 text-white font-bold px-2 py-0.5 text-xs rounded-full">
              {pendingChangesCount}
            </span>
          )}
          {activeTab === "changes" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("resolved")}
          className={`pb-4 px-6 font-semibold text-sm transition-all duration-300 relative ${
            activeTab === "resolved"
              ? "text-emerald-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Booking History
          {activeTab === "resolved" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === "pending" ? (
        <div className="space-y-4">
          {pendingBookings.length === 0 ? (
            <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl">
              No pending booking requests. All caught up!
            </div>
          ) : (
            pendingBookings.map((booking) => {
              const pitchObj = pitches.find((p) => p.id === booking.pitch);
              const venueObj = pitchObj
                ? venues.find((v) => v.id === pitchObj.venue)
                : null;

              const fixtureObj = booking.fixture
                ? fixtures.find((f) => f.id === booking.fixture)
                : null;
              const teamObj = fixtureObj
                ? teams.find((t) => t.id === fixtureObj.team)
                : null;
              const label = teamObj
                ? `${teamObj.name} vs ${fixtureObj.opponent}`
                : `${booking.external_contact_name || "External"} (Dorset/Public)`;

              const conflicts = detectConflicts(booking);

              return (
                <div
                  key={booking.id}
                  className={`glass-panel p-6 rounded-2xl border transition duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                    conflicts.length > 0
                      ? "border-amber-900/50 bg-amber-950/5"
                      : "border-slate-800"
                  }`}
                >
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xxs px-2 py-0.5 rounded font-extrabold font-display uppercase ${
                          booking.fixture
                            ? "bg-indigo-900/50 text-indigo-400 border border-indigo-900/55"
                            : "bg-pink-900/40 text-pink-400 border border-pink-900/50"
                        }`}
                      >
                        {booking.fixture ? "Club Fixture" : "External Booking"}
                      </span>
                      {booking.requires_teas && (
                        <span className="text-xxs bg-emerald-950/50 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                          <Coffee size={10} /> Teas
                        </span>
                      )}
                      {booking.requires_drinks && (
                        <span className="text-xxs bg-teal-950/50 text-teal-400 border border-teal-900/60 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                          <Coffee size={10} /> Drinks
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold font-display text-slate-100">
                      {label}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-400 text-xs">
                      <div className="flex items-center space-x-1.5">
                        <MapPin size={14} className="text-slate-500" />
                        <span>
                          {venueObj?.name} &bull; {pitchObj?.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Calendar size={14} className="text-slate-500" />
                        <span>
                          {booking.start_date === booking.end_date
                            ? booking.start_date
                            : `${booking.start_date} to ${booking.end_date}`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock size={14} className="text-slate-500" />
                        <span className="capitalize">
                          {booking.time_slot.toLowerCase().replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {booking.notes && (
                      <p className="text-xs text-slate-450 italic bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-850">
                        Notes: "{booking.notes}"
                      </p>
                    )}

                    {/* Conflict Section */}
                    {conflicts.length > 0 && (
                      <div className="bg-amber-950/40 border border-amber-900/60 rounded-xl p-3.5 space-y-2 mt-2">
                        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold font-display">
                          <AlertTriangle size={15} />
                          <span>
                            Potential Conflicts Detected ({conflicts.length})
                          </span>
                        </div>
                        <ul className="list-disc list-inside text-xxs text-amber-300/90 space-y-1 pl-1 leading-normal">
                          {conflicts.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions Panel */}
                  <div className="flex flex-col sm:flex-row lg:flex-col justify-end gap-3 sm:items-center lg:items-stretch min-w-[220px]">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(booking.id)}
                        className="flex-1 py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition shadow-lg shadow-emerald-500/10"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleDeny(booking.id)}
                        className="flex-1 py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1 transition"
                      >
                        <X size={14} /> Deny
                      </button>
                    </div>

                    <button
                      onClick={() => handleEditBooking(booking)}
                      className="py-2 px-3.5 rounded-xl border border-blue-800/50 bg-blue-950/20 hover:bg-blue-950/50 text-blue-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Pencil size={13} /> Edit / Cancel Booking
                    </button>

                    {/* Alternative Pitch Selector */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={altPitchId[booking.id] || ""}
                        onChange={(e) =>
                          setAltPitchId({
                            ...altPitchId,
                            [booking.id]: e.target.value,
                          })
                        }
                        className="bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded-lg p-2 outline-none w-full focus:border-emerald-500"
                      >
                        <option value="">Move Pitch...</option>
                        {pitches
                          .filter((p) => p.id !== booking.pitch)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {venues.find((v) => v.id === p.venue)?.name} -{" "}
                              {p.name}
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={() =>
                          handleProposeAlternative(
                            booking.id,
                            altPitchId[booking.id],
                          )
                        }
                        disabled={!altPitchId[booking.id]}
                        className="p-2 bg-indigo-650/30 hover:bg-indigo-600 border border-indigo-800/40 rounded-lg text-indigo-400 hover:text-white disabled:opacity-40 transition"
                        title="Move to alternate pitch"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === "resolved" ? (
        /* Resolved History Tab */
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-850 text-xs uppercase tracking-wider text-slate-400 font-display">
                  <th className="p-4">Fixture / Request</th>
                  <th className="p-4">Venue & Pitch</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Time Slot</th>
                  <th className="p-4">Catering</th>
                  <th className="p-4">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-850">
                {resolvedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No resolved bookings history.
                    </td>
                  </tr>
                ) : (
                  resolvedBookings.map((b) => {
                    const pitchObj = pitches.find((p) => p.id === b.pitch);
                    const venueObj = pitchObj
                      ? venues.find((v) => v.id === pitchObj.venue)
                      : null;
                    const fixObj = b.fixture
                      ? fixtures.find((f) => f.id === b.fixture)
                      : null;
                    const teamObj = fixObj
                      ? teams.find((t) => t.id === fixObj.team)
                      : null;
                    const label = teamObj
                      ? `${teamObj.name} vs ${fixObj.opponent}`
                      : b.external_contact_name || "External Org";

                    return (
                      <tr key={b.id} className="hover:bg-slate-800/10">
                        <td className="p-4 font-semibold text-slate-200">
                          {label}
                        </td>
                        <td className="p-4 text-slate-300">
                          {venueObj?.name} &bull; {pitchObj?.name}
                        </td>
                        <td className="p-4 text-slate-350">
                          {b.start_date === b.end_date
                            ? b.start_date
                            : `${b.start_date} to ${b.end_date}`}
                        </td>
                        <td className="p-4 capitalize text-slate-400">
                          {b.time_slot.toLowerCase().replace("_", " ")}
                        </td>
                        <td className="p-4">
                          <span className="text-xs text-slate-400">
                            {b.requires_teas ? "Teas" : ""}
                            {b.requires_teas && b.requires_drinks ? " & " : ""}
                            {b.requires_drinks ? "Drinks" : ""}
                            {!b.requires_teas && !b.requires_drinks
                              ? "None"
                              : ""}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block text-xxs font-bold uppercase tracking-wider px-2 py-0.5 rounded font-display ${
                              b.status === "APPROVED"
                                ? "bg-emerald-950/60 text-emerald-400"
                                : "bg-red-950/60 text-red-400"
                            }`}
                          >
                            {b.status === "APPROVED" ? "Approved" : "Denied"}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleEditBooking(b)}
                            className="py-1.5 px-3 rounded-lg border border-blue-800/50 bg-blue-950/20 hover:bg-blue-950/50 text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "changes" ? (
        <ChangeRequestsTab
          pitches={pitches}
          onPendingCountChange={setPendingChangesCount}
          onDataChanged={() => {
            // Can reload bookings via update handler
            onBookingUpdated(null, null);
          }}
        />
      ) : null}

      {/* Edit Booking Modal */}
      <BookingEditModal
        isOpen={editModal.open}
        booking={editModal.booking}
        editForm={editForm}
        setEditForm={setEditForm}
        editSaving={editSaving}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        onSubmit={handleEditSubmit}
        onDelete={handleDeleteBooking}
        onClose={() => setEditModal({ open: false, booking: null })}
        pitches={pitches}
        venues={venues}
      />

      {/* Rejection Reason Modal */}
      <RejectModal
        isOpen={rejectModal.open}
        reason={rejectModal.reason}
        setReason={(reason) => setRejectModal((prev) => ({ ...prev, reason }))}
        onSubmit={submitDenial}
        onClose={() =>
          setRejectModal({ open: false, bookingId: null, reason: "" })
        }
      />

      {/* Confirm Approve Modal — shown when competing pending bookings exist */}
      <ConfirmApproveModal
        isOpen={confirmApproveModal.open}
        booking={confirmApproveModal.booking}
        competingBookings={confirmApproveModal.competingBookings}
        isSubmitting={confirmApproveModal.isSubmitting}
        onConfirm={confirmApproval}
        onClose={() =>
          setConfirmApproveModal({
            open: false,
            booking: null,
            competingBookings: [],
            isSubmitting: false,
          })
        }
        teams={teams}
        fixtures={fixtures}
        pitches={pitches}
        venues={venues}
      />
    </div>
  );
}
