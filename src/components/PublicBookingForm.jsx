import React, { useState, useMemo } from "react";
import {
  Mail,
  User,
  Info,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
} from "lucide-react";

export default function PublicBookingForm({
  venues,
  pitches,
  onBookingCreated,
}) {
  // 1. Sort venues alphabetically, bringing the default venue to the top
  const sortedVenues = useMemo(() => {
    return [...venues].sort((a, b) => {
      if (a.is_default) return -1;
      if (b.is_default) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [venues]);

  // 2. Initialize selectedVenueId directly without an effect hook
  const [selectedVenueId, setSelectedVenueId] = useState(() => {
    const defaultV = venues.find((v) => v.is_default) || sortedVenues[0];
    return defaultV ? defaultV.id.toString() : "";
  });

  const [form, setForm] = useState({
    external_contact_name: "",
    external_contact_email: "",
    pitch: "",
    start_date: "",
    end_date: "",
    isMultiDay: false,
    time_slot: "ALL_DAY",
    requires_teas: false,
    requires_drinks: false,
    notes: "",
    opponent: "External Match / Event",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filter pitches by venue and sort by entity_type (MAIN, YOUTH, NET, OUTFIELD), then alphabetically
  const venueFilteredPitches = useMemo(() => {
    if (!selectedVenueId) return [];
    const filtered = pitches.filter((p) => p.venue === Number(selectedVenueId));

    const groupOrder = { MAIN: 1, YOUTH: 2, NET: 3, OUTFIELD: 4 };

    return filtered.sort((a, b) => {
      const typeA = (a.entity_type || a.type || "").toUpperCase();
      const typeB = (b.entity_type || b.type || "").toUpperCase();

      const groupA = groupOrder[typeA] || 99;
      const groupB = groupOrder[typeB] || 99;

      if (groupA !== groupB) {
        return groupA - groupB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [pitches, selectedVenueId]);

  // Reset selected pitch if the venue changes
  const handleVenueChange = (e) => {
    const newVenueId = e.target.value;
    setSelectedVenueId(newVenueId);
    setForm((prev) => ({ ...prev, pitch: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.external_contact_name ||
      !form.external_contact_email ||
      !form.pitch ||
      !form.start_date
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    const payload = {
      pitch: parseInt(form.pitch, 10),
      start_date: form.start_date,
      end_date: form.isMultiDay ? form.end_date : form.start_date,
      time_slot: form.time_slot,
      requires_teas: form.requires_teas,
      requires_drinks: form.requires_drinks,
      notes: form.notes,
      external_contact_name: form.external_contact_name,
      external_contact_email: form.external_contact_email,
      fixture_team: null,
      fixture_opponent: form.opponent,
    };

    try {
      await onBookingCreated(payload);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      alert(`Failed to submit booking request:\n${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      external_contact_name: "",
      external_contact_email: "",
      pitch: "",
      start_date: "",
      end_date: "",
      isMultiDay: false,
      time_slot: "ALL_DAY",
      requires_teas: false,
      requires_drinks: false,
      notes: "",
      opponent: "External Match / Event",
    });
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="w-full max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-display text-slate-100">
            Pitch Request Submitted!
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your booking request has been sent to the Fixture Secretary for
            approval. We will contact you at{" "}
            <strong className="text-slate-200">
              {form.external_contact_email}
            </strong>{" "}
            once a decision is made.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="w-full px-4 py-3 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold font-display border border-slate-700/60 hover:bg-slate-700 hover:text-slate-200 transition-all active:scale-[0.97]"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-800 space-y-1.5">
        <h2 className="text-lg font-bold font-display text-slate-100">
          External Pitch Booking Request
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Non-club teams and regional boards (e.g. Dorset Cricket) can use this
          form to request access to club pitches.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5 font-display">
              <User size={12} className="text-emerald-400" /> Contact Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.external_contact_name}
              onChange={(e) =>
                setForm({ ...form, external_contact_name: e.target.value })
              }
              placeholder="e.g. Sarah Miller"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5 font-display">
              <Mail size={12} className="text-emerald-400" /> Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={form.external_contact_email}
              onChange={(e) =>
                setForm({ ...form, external_contact_email: e.target.value })
              }
              placeholder="e.g. sarah@dorsetcricket.org"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              required
            />
          </div>
        </div>

        {/* Venue & Pitch Selection Split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 font-display">
              Venue <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedVenueId}
              onChange={handleVenueChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              required
            >
              <option value="">— Select Venue —</option>
              {sortedVenues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 font-display">
              Requested Pitch <span className="text-red-400">*</span>
            </label>
            <select
              value={form.pitch}
              onChange={(e) => setForm({ ...form, pitch: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              required
              disabled={!selectedVenueId}
            >
              <option value="">— Select Pitch —</option>
              {venueFilteredPitches.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Slot */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5 font-display">
            <Clock size={12} className="text-emerald-400" /> Time Slot <span className="text-red-400">*</span>
          </label>
          <select
            value={form.time_slot}
            onChange={(e) => setForm({ ...form, time_slot: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="MORNING">Morning (09:00 - 13:00)</option>
            <option value="AFTERNOON">Afternoon (13:30 - 18:00)</option>
            <option value="EVENING">Evening (18:00 - 21:00)</option>
            <option value="ALL_DAY">All Day</option>
          </select>
        </div>

        {/* Event Name */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 font-display">
            Event Name / Match Details <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.opponent}
            onChange={(e) => setForm({ ...form, opponent: e.target.value })}
            placeholder="e.g. Dorset U18s County Cup vs Hampshire"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            required
          />
        </div>

        {/* Dates Setup */}
        <div className="bg-slate-950/60 p-4 rounded-xl space-y-3 border border-slate-800">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="publicMultiDay"
              checked={form.isMultiDay}
              onChange={(e) =>
                setForm({ ...form, isMultiDay: e.target.checked })
              }
              className="rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 w-4 h-4"
            />
            <label
              htmlFor="publicMultiDay"
              className="text-xs font-medium text-slate-200 cursor-pointer font-display"
            >
              This match spans multiple days (Multi-day event)
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5 font-display">
                <Calendar size={12} className="text-emerald-400" /> {form.isMultiDay ? "Start Date" : "Date"} <span className="text-red-400">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      start_date: e.target.value,
                      end_date: form.isMultiDay ? form.end_date : e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  required
                />
                <Calendar
                  size={18}
                  className="absolute right-3.5 text-emerald-500 pointer-events-none"
                />
              </div>
            </div>
            {form.isMultiDay && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5 font-display">
                  <Calendar size={12} className="text-emerald-400" /> End Date <span className="text-red-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm({ ...form, end_date: e.target.value })
                    }
                    min={form.start_date}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    required
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

        {/* Catering requests */}
        <div className="flex justify-around bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 text-xs">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.requires_teas}
              onChange={(e) =>
                setForm({ ...form, requires_teas: e.target.checked })
              }
              className="rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 w-4 h-4"
            />
            <span className="text-slate-300 font-display">
              Request Teas
            </span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.requires_drinks}
              onChange={(e) =>
                setForm({ ...form, requires_drinks: e.target.checked })
              }
              className="rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 w-4 h-4"
            />
            <span className="text-slate-300 font-display">Request Drinks</span>
          </label>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 font-display">
            Notes / Special Requests
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Describe the match requirement (e.g. grass pitch preference, extra boundary markers, rollers requested)"
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
          />
        </div>

        {/* Info Box */}
        <div className="flex items-start space-x-2.5 bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-xl text-emerald-300 text-xs">
          <Info size={16} className="mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            All public requests undergo verification for outfield overlap rules
            and availability against primary club teams.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold font-display text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={15} />
          {loading ? "Submitting..." : "Send Booking Request"}
        </button>
      </form>
    </div>
  );
}