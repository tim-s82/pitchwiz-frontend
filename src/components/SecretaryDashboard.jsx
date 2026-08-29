import React, { useState, useMemo, useEffect } from "react";
import { api } from "../services/api";
import {
  ShieldCheck,
  UserCheck,
  Check,
  X,
  AlertTriangle,
  HelpCircle,
  RefreshCcw,
  MapPin,
  Calendar,
  Clock,
  Coffee,
  GitPullRequestArrow,
  Pencil,
  Trash2,
} from "lucide-react";
const API_BASE_URL = import.meta.env.VITE_API_URL;

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
  currentUser,
}) {
  const [activeTab, setActiveTab] = useState("pending");
  const [altPitchId, setAltPitchId] = useState({});

  // Rejection reason modal state
  const [rejectModal, setRejectModal] = useState({
    open: false,
    bookingId: null,
    reason: "",
  });

  // Change requests state
  const [changeRequests, setChangeRequests] = useState([]);
  const [changeRejectModal, setChangeRejectModal] = useState({
    open: false,
    crId: null,
    reason: "",
  });

  // Edit modal state
  const [editModal, setEditModal] = useState({ open: false, booking: null });
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchChangeRequests();
  }, []);

  const fetchChangeRequests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/booking-change-requests/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (res.ok) setChangeRequests(await res.json());
    } catch (e) {
      console.warn("Could not fetch change requests", e);
    }
  };

  const pendingBookings = useMemo(() => {
    return bookings.filter((b) => b.status === "PENDING");
  }, [bookings]);

  const resolvedBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.status === "APPROVED" || b.status === "DENIED",
    );
  }, [bookings]);

  // Conflict Detection Logic for a pending booking
  const detectConflicts = (booking) => {
    const conflicts = [];

    // 1. Direct overlap
    const directOverlap = bookings.find(
      (b) =>
        b.id !== booking.id &&
        b.pitch === booking.pitch &&
        b.status === "APPROVED" &&
        // Check date range intersection
        booking.start_date <= b.end_date &&
        booking.end_date >= b.start_date &&
        (b.time_slot === "ALL_DAY" ||
          booking.time_slot === "ALL_DAY" ||
          b.time_slot === booking.time_slot),
    );
    if (directOverlap) {
      const matchDetails = directOverlap.fixture
        ? fixtures.find((f) => f.id === directOverlap.fixture)
        : null;
      conflicts.push(
        `Direct Overlap: Already booked for ${matchDetails ? matchDetails.opponent : directOverlap.external_contact_name || "Another fixture"}`,
      );
    }

    // 2. Outfield Overlap Logic (Blocks pitches)
    // Case A: This booking's pitch blocks another pitch, and the other pitch has a booking
    const currentPitch = pitches.find((p) => p.id === booking.pitch);
    if (
      currentPitch &&
      currentPitch.blocks_pitches &&
      currentPitch.blocks_pitches.length > 0
    ) {
      currentPitch.blocks_pitches.forEach((blockedId) => {
        const activeBlockedBooking = bookings.find(
          (b) =>
            b.id !== booking.id &&
            b.pitch === blockedId &&
            b.status === "APPROVED" &&
            booking.start_date <= b.end_date &&
            booking.end_date >= b.start_date &&
            (b.time_slot === "ALL_DAY" ||
              booking.time_slot === "ALL_DAY" ||
              b.time_slot === booking.time_slot),
        );
        if (activeBlockedBooking) {
          const pName = pitches.find((p) => p.id === blockedId)?.name || "";
          conflicts.push(
            `Outfield Overlap: Booking this blocks ${pName}, which has an approved match.`,
          );
        }
      });
    }

    // Case B: Another pitch blocks this pitch, and the blocking pitch has an approved booking
    const blockingPitches = pitches.filter(
      (p) => p.blocks_pitches && p.blocks_pitches.includes(booking.pitch),
    );
    for (const bp of blockingPitches) {
      const activeBlockingBooking = bookings.find(
        (b) =>
          b.id !== booking.id &&
          b.pitch === bp.id &&
          b.status === "APPROVED" &&
          booking.start_date <= b.end_date &&
          booking.end_date >= b.start_date &&
          (b.time_slot === "ALL_DAY" ||
            booking.time_slot === "ALL_DAY" ||
            b.time_slot === booking.time_slot),
      );
      if (activeBlockingBooking) {
        conflicts.push(
          `Outfield Overlap: ${bp.name} is booked, which blocks this outfield pitch.`,
        );
      }
    }

    // 3. Length support
    if (booking.fixture) {
      const fix = fixtures.find((f) => f.id === booking.fixture);
      const team = fix ? teams.find((t) => t.id === fix.team) : null;
      if (team && team.required_length && currentPitch) {
        if (!currentPitch.supported_lengths.includes(team.required_length)) {
          const reqLen =
            pitchLengths.find((l) => l.id === team.required_length)
              ?.length_yards || "";
          conflicts.push(
            `Pitch Specifics: ${currentPitch.name} does not support the required length for ${team.name} (${reqLen} Yards).`,
          );
        }
      }
    }

    return conflicts;
  };

  const handleApprove = async (id) => {
    await onBookingStatusUpdate(id, "APPROVED");
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
      await fetch(
        `${API_BASE_URL}/api/pitchbookings/${rejectModal.bookingId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            status: "DENIED",
            rejection_reason: rejectModal.reason,
          }),
        },
      );
      setRejectModal({ open: false, bookingId: null, reason: "" });
      await onBookingStatusUpdate(rejectModal.bookingId, "DENIED");
    } catch (e) {
      console.error(e);
    }
  };

  // Change request approve/reject
  const handleApproveChange = async (crId) => {
    try {
      await fetch(`${API_BASE_URL}/api/booking-change-requests/${crId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      fetchChangeRequests();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectChange = (crId) => {
    setChangeRejectModal({ open: true, crId, reason: "" });
  };

  const submitChangeRejection = async () => {
    if (!changeRejectModal.reason.trim()) {
      alert("A rejection reason is required.");
      return;
    }
    try {
      await fetch(
        `${API_BASE_URL}/api/booking-change-requests/${changeRejectModal.crId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            status: "REJECTED",
            rejection_reason: changeRejectModal.reason,
          }),
        },
      );
      setChangeRejectModal({ open: false, crId: null, reason: "" });
      fetchChangeRequests();
    } catch (e) {
      console.error(e);
    }
  };

  const handleProposeAlternative = async (bookingId, newPitchId) => {
    if (!newPitchId) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/pitchbookings/${bookingId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({ pitch: parseInt(newPitchId) }),
        },
      );
      if (response.ok) {
        alert("Pitch updated successfully!");
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditBooking = (booking) => {
    const fix = booking.fixture
      ? fixtures.find((f) => f.id === booking.fixture)
      : null;
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
        pitch: parseInt(editForm.pitchId),
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

  const pendingChangeRequests = changeRequests.filter(
    (cr) => cr.status === "PENDING",
  );

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
          {pendingChangeRequests.length > 0 && (
            <span className="ml-2 bg-indigo-500 text-white font-bold px-2 py-0.5 text-xs rounded-full">
              {pendingChangeRequests.length}
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
                    <td colSpan={6} className="p-8 text-center text-slate-500">
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
        /* Change Requests Tab */
        <div className="space-y-4">
          {pendingChangeRequests.length === 0 ? (
            <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl">
              No pending change requests.
            </div>
          ) : (
            pendingChangeRequests.map((cr) => {
              const origBooking = bookings.find(
                (b) => b.id === cr.original_booking,
              );
              const newPitch = cr.new_pitch
                ? pitches.find((p) => p.id === cr.new_pitch)
                : null;
              return (
                <div
                  key={cr.id}
                  className="glass-panel p-6 rounded-2xl border border-indigo-900/40 bg-indigo-950/5 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <GitPullRequestArrow
                      size={16}
                      className="text-indigo-400"
                    />
                    <span className="text-sm font-bold text-indigo-300">
                      Change Request #{cr.id}
                    </span>
                    <span className="text-xxs bg-indigo-900/50 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded">
                      Original Booking #{cr.original_booking}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-300">
                    {cr.new_start_date && (
                      <div>
                        <span className="text-slate-500">New Start:</span>{" "}
                        {cr.new_start_date}
                      </div>
                    )}
                    {cr.new_end_date && (
                      <div>
                        <span className="text-slate-500">New End:</span>{" "}
                        {cr.new_end_date}
                      </div>
                    )}
                    {cr.new_time_slot && (
                      <div>
                        <span className="text-slate-500">New Slot:</span>{" "}
                        {cr.new_time_slot}
                      </div>
                    )}
                    {newPitch && (
                      <div>
                        <span className="text-slate-500">New Pitch:</span>{" "}
                        {newPitch.name}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleApproveChange(cr.id)}
                      className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1 transition"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleRejectChange(cr.id)}
                      className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1 transition"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}

      {/* Edit Booking Modal */}
      {editModal.open && editModal.booking && (
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
                    Booking #{editModal.booking.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditModal({ open: false, booking: null })}
                className="text-slate-400 hover:text-slate-200 transition p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
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
                      onClick={handleDeleteBooking}
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
                    onClick={() => setEditModal({ open: false, booking: null })}
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
      )}

      {/* Rejection Reason Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white font-display">
              Denial Reason
            </h3>
            <p className="text-sm text-slate-400">
              A reason must be provided when denying a booking.
            </p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal({ ...rejectModal, reason: e.target.value })
              }
              placeholder="Enter the reason for denial..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-xl p-3 h-28 outline-none focus:border-red-500 resize-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setRejectModal({ open: false, bookingId: null, reason: "" })
                }
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={submitDenial}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition"
              >
                Deny Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Request Rejection Modal */}
      {changeRejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white font-display">
              Rejection Reason
            </h3>
            <p className="text-sm text-slate-400">
              A reason must be provided when rejecting a change request.
            </p>
            <textarea
              value={changeRejectModal.reason}
              onChange={(e) =>
                setChangeRejectModal({
                  ...changeRejectModal,
                  reason: e.target.value,
                })
              }
              placeholder="Enter the reason for rejection..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-xl p-3 h-28 outline-none focus:border-red-500 resize-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setChangeRejectModal({ open: false, crId: null, reason: "" })
                }
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={submitChangeRejection}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition"
              >
                Reject Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
