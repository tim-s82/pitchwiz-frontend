import React, { useState } from "react";
import {
  Mail,
  User,
  Info,
  Calendar,
  Clock,
  HelpCircle,
  Send,
  CheckCircle2,
} from "lucide-react";

export default function PublicBookingForm({
  venues,
  pitches,
  onBookingCreated,
}) {
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
    opponent: "External Match / Event", // Default placeholder for external booking
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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
      pitch: parseInt(form.pitch),
      start_date: form.start_date,
      end_date: form.isMultiDay ? form.end_date : form.start_date,
      time_slot: form.time_slot,
      requires_teas: form.requires_teas,
      requires_drinks: form.requires_drinks,
      notes: form.notes,
      external_contact_name: form.external_contact_name,
      external_contact_email: form.external_contact_email,
      fixture_team: null, // Null indicates external booking
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
      <div className="glass-panel p-8 rounded-2xl max-w-lg mx-auto text-center space-y-6 border border-emerald-900/40 bg-emerald-950/5">
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
          className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel p-8 rounded-2xl max-w-xl mx-auto border border-slate-800">
      <div className="mb-6 space-y-2">
        <h2 className="text-xl font-bold font-display text-slate-100">
          External Pitch Booking Request
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Non-club teams and regional boards (e.g. Dorset Cricket) can use this
          form to request access to club pitches.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User size={12} /> Contact Name
            </label>
            <input
              type="text"
              value={form.external_contact_name}
              onChange={(e) =>
                setForm({ ...form, external_contact_name: e.target.value })
              }
              placeholder="e.g. Sarah Miller"
              className="w-full bg-slate-900 border border-slate-850 text-slate-200 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail size={12} /> Email Address
            </label>
            <input
              type="email"
              value={form.external_contact_email}
              onChange={(e) =>
                setForm({ ...form, external_contact_email: e.target.value })
              }
              placeholder="e.g. sarah@dorsetcricket.org"
              className="w-full bg-slate-900 border border-slate-850 text-slate-200 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
              required
            />
          </div>
        </div>

        {/* Pitch & Time Slot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Requested Pitch
            </label>
            <select
              value={form.pitch}
              onChange={(e) => setForm({ ...form, pitch: e.target.value })}
              className="w-full bg-slate-900 border border-slate-855 text-slate-200 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
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
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock size={12} /> Time Slot
            </label>
            <select
              value={form.time_slot}
              onChange={(e) => setForm({ ...form, time_slot: e.target.value })}
              className="w-full bg-slate-900 border border-slate-855 text-slate-200 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
            >
              <option value="MORNING">Morning Slot (09:00 - 13:00)</option>
              <option value="AFTERNOON">Afternoon Slot (13:30 - 18:00)</option>
              <option value="EVENING">Evening Slot (18:00 - 21:00)</option>
              <option value="ALL_DAY">All Day Slot</option>
            </select>
          </div>
        </div>

        {/* Event Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Event Name / Match Details
          </label>
          <input
            type="text"
            value={form.opponent}
            onChange={(e) => setForm({ ...form, opponent: e.target.value })}
            placeholder="e.g. Dorset U18s County Cup vs Hampshire"
            className="w-full bg-slate-900 border border-slate-850 text-slate-200 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
            required
          />
        </div>

        {/* Dates Setup */}
        <div className="bg-slate-900/50 p-4 rounded-xl space-y-3 border border-slate-850">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="publicMultiDay"
              checked={form.isMultiDay}
              onChange={(e) =>
                setForm({ ...form, isMultiDay: e.target.checked })
              }
              className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
            />
            <label
              htmlFor="publicMultiDay"
              className="text-sm font-medium text-slate-200"
            >
              This match spans multiple days (Multi-day event)
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar size={12} /> {form.isMultiDay ? "Start Date" : "Date"}
              </label>
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
                className="w-full bg-slate-900 border border-slate-850 text-slate-200 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                required
              />
            </div>
            {form.isMultiDay && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Calendar size={12} /> End Date
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                  min={form.start_date}
                  className="w-full bg-slate-900 border border-slate-850 text-slate-200 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* Catering requests */}
        <div className="flex justify-around bg-slate-900/40 p-4 rounded-xl border border-slate-850">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.requires_teas}
              onChange={(e) =>
                setForm({ ...form, requires_teas: e.target.checked })
              }
              className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-350">
              We request Teas for this fixture
            </span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.requires_drinks}
              onChange={(e) =>
                setForm({ ...form, requires_drinks: e.target.checked })
              }
              className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-350">We request Drinks</span>
          </label>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Notes / Special Requests
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Describe the match requirement (e.g. grass pitch preference, extra boundary markers, rollers requested)"
            rows={3}
            className="w-full bg-slate-900 border border-slate-850 text-slate-200 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
          />
        </div>

        {/* Info Box */}
        <div className="flex items-start space-x-2 bg-slate-900/30 border border-slate-850 p-3.5 rounded-xl text-slate-450 text-xs">
          <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
          <p className="leading-normal">
            All public requests undergo verification for outfield overlap rules
            and availability against primary club teams.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-2 transition"
        >
          <Send size={15} />
          {loading ? "Submitting..." : "Send Booking Request"}
        </button>
      </form>
    </div>
  );
}
