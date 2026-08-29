import React, { useMemo, useState, useEffect } from "react";
import {
  Coffee,
  ListCollapse,
  Utensils,
  Calendar,
  MapPin,
  Clock,
  FileText,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function CatererDashboard({
  venues,
  pitches,
  teams,
  fixtures,
  bookings,
  currentUser,
}) {
  const [cateringRequests, setCateringRequests] = useState([]);
  const [rejectModal, setRejectModal] = useState({
    open: false,
    crId: null,
    reason: "",
  });

  useEffect(() => {
    fetchCateringRequests();
  }, []);

  const fetchCateringRequests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/catering-requests/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (res.ok) setCateringRequests(await res.json());
    } catch (e) {
      console.warn("Could not fetch catering requests", e);
    }
  };

  // Filter only APPROVED bookings that require teas or drinks (legacy fallback)
  const upcomingCatering = useMemo(() => {
    return bookings
      .filter(
        (b) =>
          b.status === "APPROVED" && (b.requires_teas || b.requires_drinks),
      )
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  }, [bookings]);

  const pendingCateringRequests = useMemo(() => {
    return cateringRequests.filter((cr) => cr.status === "PENDING");
  }, [cateringRequests]);

  const resolvedCateringRequests = useMemo(() => {
    return cateringRequests.filter((cr) => cr.status !== "PENDING");
  }, [cateringRequests]);

  // Aggregate stats
  const stats = useMemo(() => {
    let teasCount = 0;
    let drinksCount = 0;
    let pendingCount = pendingCateringRequests.length;
    upcomingCatering.forEach((b) => {
      if (b.requires_teas) teasCount++;
      if (b.requires_drinks) drinksCount++;
    });
    return {
      teasCount,
      drinksCount,
      total: upcomingCatering.length,
      pendingCount,
    };
  }, [upcomingCatering, pendingCateringRequests]);

  const handleApproveCatering = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/catering-requests/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      fetchCateringRequests();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectCatering = (id) => {
    setRejectModal({ open: true, crId: id, reason: "" });
  };

  const submitCateringRejection = async () => {
    if (!rejectModal.reason.trim()) {
      alert("A rejection reason is required.");
      return;
    }
    try {
      await fetch(
        `${API_BASE_URL}/api/catering-requests/${rejectModal.crId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            status: "REJECTED",
            rejection_reason: rejectModal.reason,
          }),
        },
      );
      setRejectModal({ open: false, crId: null, reason: "" });
      fetchCateringRequests();
    } catch (e) {
      console.error(e);
    }
  };

  const [activeTab, setActiveTab] = useState("pending");

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
            <Utensils size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-slate-100">
              Caterer Dashboard
            </h2>
            <p className="text-sm text-slate-400">
              Manage catering requests for confirmed matches.
            </p>
          </div>
        </div>

        {/* Caterer Summary Stats */}
        <div className="flex gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 flex items-center space-x-2">
            <Coffee className="text-emerald-400" size={18} />
            <div>
              <span className="block text-xxs font-bold text-slate-400 uppercase tracking-wider font-display">
                Teas Requested
              </span>
              <span className="text-lg font-bold text-slate-100">
                {stats.teasCount}
              </span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 flex items-center space-x-2">
            <Coffee className="text-teal-400" size={18} />
            <div>
              <span className="block text-xxs font-bold text-slate-400 uppercase tracking-wider font-display">
                Drinks Requested
              </span>
              <span className="text-lg font-bold text-slate-100">
                {stats.drinksCount}
              </span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 flex items-center space-x-2">
            <AlertCircle className="text-amber-400" size={18} />
            <div>
              <span className="block text-xxs font-bold text-slate-400 uppercase tracking-wider font-display">
                Pending Approval
              </span>
              <span className="text-lg font-bold text-slate-100">
                {stats.pendingCount}
              </span>
            </div>
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
          Pending Catering Requests
          {pendingCateringRequests.length > 0 && (
            <span className="ml-2 bg-amber-500 text-slate-950 font-bold px-2 py-0.5 text-xs rounded-full">
              {pendingCateringRequests.length}
            </span>
          )}
          {activeTab === "pending" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`pb-4 px-6 font-semibold text-sm transition-all duration-300 relative ${
            activeTab === "upcoming"
              ? "text-emerald-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Upcoming Orders
          {activeTab === "upcoming" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
          )}
        </button>
      </div>

      {activeTab === "pending" ? (
        <div className="space-y-4">
          {pendingCateringRequests.length === 0 ? (
            <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl">
              No pending catering requests. All caught up!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingCateringRequests.map((cr) => {
                const booking = bookings.find((b) => b.id === cr.booking);
                const pitchObj = booking
                  ? pitches.find((p) => p.id === booking.pitch)
                  : null;
                const venueObj = pitchObj
                  ? venues.find((v) => v.id === pitchObj.venue)
                  : null;
                const fixtureObj = booking?.fixture
                  ? fixtures.find((f) => f.id === booking.fixture)
                  : null;
                const teamObj = fixtureObj
                  ? teams.find((t) => t.id === fixtureObj.team)
                  : null;
                const label = teamObj
                  ? `${teamObj.name} vs ${fixtureObj.opponent}`
                  : booking?.external_contact_name || "External";

                return (
                  <div
                    key={cr.id}
                    className="glass-panel p-5 rounded-2xl border border-amber-900/40 bg-amber-950/5 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-100 leading-snug font-display text-base">
                        {label}
                      </h4>
                      <div className="flex space-x-1.5 shrink-0">
                        {cr.requires_teas && (
                          <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-900/50 text-[10px] font-extrabold font-display uppercase px-2 py-0.5 rounded">
                            Teas
                          </span>
                        )}
                        {cr.requires_drinks && (
                          <span className="bg-teal-950/60 text-teal-400 border border-teal-900/50 text-[10px] font-extrabold font-display uppercase px-2 py-0.5 rounded">
                            Drinks
                          </span>
                        )}
                      </div>
                    </div>

                    {booking && (
                      <div className="space-y-1.5 text-xs text-slate-350">
                        <div className="flex items-center space-x-2">
                          <Calendar
                            size={14}
                            className="text-slate-500 shrink-0"
                          />
                          <span>
                            {booking.start_date === booking.end_date
                              ? booking.start_date
                              : `${booking.start_date} to ${booking.end_date}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin
                            size={14}
                            className="text-slate-500 shrink-0"
                          />
                          <span>
                            {venueObj?.name} &bull; {pitchObj?.name}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApproveCatering(cr.id)}
                        className="flex-1 py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition shadow-lg shadow-emerald-500/10"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectCatering(cr.id)}
                        className="flex-1 py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1 transition"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Upcoming Orders Tab (legacy view from bookings) */
        <div className="space-y-4">
          <h3 className="text-base font-bold font-display tracking-wide text-slate-200">
            Confirmed Catering
          </h3>

          {upcomingCatering.length === 0 ? (
            <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl">
              No catering requests for the upcoming scheduled matches.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingCatering.map((booking) => {
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

                const fixtureLabel = teamObj
                  ? `${teamObj.name} vs ${fixtureObj.opponent}`
                  : booking.external_contact_name || "External Match";

                return (
                  <div
                    key={booking.id}
                    className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-100 leading-snug font-display text-base">
                          {fixtureLabel}
                        </h4>
                        <div className="flex space-x-1.5 shrink-0">
                          {booking.requires_teas && (
                            <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-900/50 text-[10px] font-extrabold font-display uppercase px-2 py-0.5 rounded">
                              Teas
                            </span>
                          )}
                          {booking.requires_drinks && (
                            <span className="bg-teal-950/60 text-teal-400 border border-teal-900/50 text-[10px] font-extrabold font-display uppercase px-2 py-0.5 rounded">
                              Drinks
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-350">
                        <div className="flex items-center space-x-2">
                          <Calendar
                            size={14}
                            className="text-slate-500 shrink-0"
                          />
                          <span>
                            {booking.start_date === booking.end_date
                              ? booking.start_date
                              : `${booking.start_date} to ${booking.end_date}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin
                            size={14}
                            className="text-slate-500 shrink-0"
                          />
                          <span>
                            {venueObj?.name} &bull; {pitchObj?.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock
                            size={14}
                            className="text-slate-500 shrink-0"
                          />
                          <span className="capitalize">
                            {booking.time_slot.toLowerCase().replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {booking.notes ? (
                      <div className="bg-slate-900/55 p-3 rounded-xl border border-slate-850 flex items-start space-x-2">
                        <FileText
                          size={14}
                          className="text-slate-450 mt-0.5 shrink-0"
                        />
                        <div className="text-xxs text-slate-400 leading-normal">
                          <span className="font-bold text-slate-300 block mb-0.5 font-display">
                            Notes/Dietary Info:
                          </span>
                          "{booking.notes}"
                        </div>
                      </div>
                    ) : (
                      <div className="text-xxs text-slate-500 italic">
                        No notes provided by requestor.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white font-display">
              Rejection Reason
            </h3>
            <p className="text-sm text-slate-400">
              A reason must be provided when rejecting a catering request.
            </p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal({ ...rejectModal, reason: e.target.value })
              }
              placeholder="Enter the reason for rejection..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-xl p-3 h-28 outline-none focus:border-red-500 resize-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setRejectModal({ open: false, crId: null, reason: "" })
                }
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={submitCateringRejection}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
