import React, { useState, useMemo } from 'react';
import { api } from '../services/api';
import { Calendar, Filter, Plus, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert } from 'lucide-react';

export default function CalendarView({
  venues,
  pitches,
  teams,
  fixtures,
  bookings,
  pitchLengths,
  onBookingCreated
}) {
  const [selectedVenueId, setSelectedVenueId] = useState('all');
  const [selectedTeamId, setSelectedTeamId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Date range state: start at current week or today
  const [startDateStr, setStartDateStr] = useState(() => {
    const today = new Date();
    // Default to current Monday
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    pitchId: '',
    date: '',
    timeSlot: 'ALL_DAY',
    teamId: '',
    opponent: '',
    requiresTeas: false,
    requiresDrinks: false,
    notes: '',
    isMultiDay: false,
    endDate: ''
  });

  // Generate 7 days starting from startDateStr
  const datesList = useMemo(() => {
    const start = new Date(startDateStr);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const isoStr = d.toISOString().split('T')[0];
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      return { isoStr, label: `${weekday} ${dayNum} ${month}`, dateObj: d };
    });
  }, [startDateStr]);

  // Adjust week
  const shiftWeek = (weeks) => {
    const d = new Date(startDateStr);
    d.setDate(d.getDate() + weeks * 7);
    setStartDateStr(d.toISOString().split('T')[0]);
  };

  // Find compatible pitch lengths for the filtered team
  const filteredTeam = useMemo(() => {
    if (selectedTeamId === 'all') return null;
    return teams.find(t => t.id === parseInt(selectedTeamId));
  }, [selectedTeamId, teams]);

  // Filter Pitches based on venue and selected team compatibility
  const filteredPitches = useMemo(() => {
    return pitches.filter(pitch => {
      // 1. Venue Filter
      if (selectedVenueId !== 'all' && pitch.venue !== parseInt(selectedVenueId)) {
        return false;
      }
      // 2. Team Length Compatibility Filter
      if (filteredTeam && filteredTeam.required_length) {
        if (!pitch.supported_lengths.includes(filteredTeam.required_length)) {
          return false;
        }
      }
      return true;
    });
  }, [pitches, selectedVenueId, filteredTeam]);

  // Check if a date falls within booking range
  const isDateInBooking = (dateStr, booking) => {
    return dateStr >= booking.start_date && dateStr <= booking.end_date;
  };

  // Build booking grid cell mapping: returns booking info if occupied or blocked
  const getCellStatus = (pitchId, dateStr, timeSlot) => {
    // 1. Check direct bookings on this pitch
    const directBooking = bookings.find(b => 
      b.pitch === pitchId && 
      isDateInBooking(dateStr, b) && 
      (b.time_slot === 'ALL_DAY' || timeSlot === 'ALL_DAY' || b.time_slot === timeSlot)
    );

    if (directBooking) {
      if (selectedStatus !== 'all' && directBooking.status !== selectedStatus) {
        return null;
      }
      const fixtureObj = fixtures.find(f => f.id === directBooking.fixture);
      const teamObj = fixtureObj ? teams.find(t => t.id === fixtureObj.team) : null;
      const label = teamObj 
        ? `${teamObj.name} vs ${fixtureObj.opponent}` 
        : directBooking.external_contact_name || 'External Booking';
      
      return {
        type: 'BOOKED',
        booking: directBooking,
        label,
        status: directBooking.status
      };
    }

    // 2. Outfield Overlap Blocking Logic
    // Find if another pitch blocks this pitch, and check if that other pitch has an approved booking
    const blockingPitch = pitches.find(p => p.blocks_pitches.includes(pitchId));
    if (blockingPitch) {
      const activeBlockingBooking = bookings.find(b =>
        b.pitch === blockingPitch.id &&
        isDateInBooking(dateStr, b) &&
        b.status === 'APPROVED' &&
        (b.time_slot === 'ALL_DAY' || timeSlot === 'ALL_DAY' || b.time_slot === timeSlot)
      );

      if (activeBlockingBooking) {
        return {
          type: 'BLOCKED',
          label: `Blocked (${blockingPitch.name} active)`,
          reason: `Outfield overlap due to booking on ${blockingPitch.name}`
        };
      }
    }

    return null;
  };

  const handleCellClick = (pitchId, dateStr, timeSlot, existingCell) => {
    if (existingCell) return; // Can't book already booked/blocked slots
    
    setModalData({
      pitchId: pitchId.toString(),
      date: dateStr,
      timeSlot,
      teamId: selectedTeamId !== 'all' ? selectedTeamId : '',
      opponent: '',
      requiresTeas: false,
      requiresDrinks: false,
      notes: '',
      isMultiDay: false,
      endDate: dateStr
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!modalData.pitchId || !modalData.date || !modalData.teamId || !modalData.opponent) {
      alert("Please fill in all required fields.");
      return;
    }

    const payload = {
      pitch: parseInt(modalData.pitchId),
      start_date: modalData.date,
      end_date: modalData.isMultiDay ? modalData.endDate : modalData.date,
      time_slot: modalData.timeSlot,
      requires_teas: modalData.requiresTeas,
      requires_drinks: modalData.requiresDrinks,
      notes: modalData.notes,
      // For simplicity, we auto-create a fixture or handle it in serialization.
      // We will supply values that map to creation
      fixture_team: parseInt(modalData.teamId),
      fixture_opponent: modalData.opponent
    };

    try {
      await onBookingCreated(payload);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to submit request.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header with Controls & Filters */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => shiftWeek(-1)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition border border-slate-700 text-slate-300"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center space-x-2 text-lg font-semibold tracking-wide font-display text-slate-100">
            <Calendar className="text-emerald-500" size={22} />
            <span>Week Starting {new Date(startDateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <button 
            onClick={() => shiftWeek(1)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition border border-slate-700 text-slate-300"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value)}
              className="bg-slate-800 text-slate-200 text-sm rounded-xl py-2 px-3 outline-none border border-slate-700 w-full focus:border-emerald-500"
            >
              <option value="all">All Venues</option>
              {venues.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="bg-slate-800 text-slate-200 text-sm rounded-xl py-2 px-3 outline-none border border-slate-700 w-full focus:border-emerald-500"
          >
            <option value="all">Filter by Team Length</option>
            {teams.filter(t => !t.is_external).map(t => {
              const length = pitchLengths.find(l => l.id === t.required_length);
              return (
                <option key={t.id} value={t.id}>
                  {t.name} ({length ? `${length.length_yards}y` : 'No length'})
                </option>
              );
            })}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-800 text-slate-200 text-sm rounded-xl py-2 px-3 outline-none border border-slate-700 w-full focus:border-emerald-500"
          >
            <option value="all">All Booking Statuses</option>
            <option value="APPROVED">Confirmed Only</option>
            <option value="PENDING">Pending Only</option>
          </select>
        </div>
      </div>

      {/* Info Warning Bar */}
      {filteredTeam && (
        <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-xl flex items-center space-x-3 text-emerald-300 text-sm">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>
            Filtering pitches compatible with <strong>{filteredTeam.name}</strong> (Requires{' '}
            <strong>
              {pitchLengths.find(l => l.id === filteredTeam.required_length)?.length_yards} Yards
            </strong>{' '}
            strip). Unsupported pitches are hidden.
          </span>
        </div>
      )}

      {/* Responsive Calendar Matrix */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[900px]">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-850">
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-56 font-display border-r border-slate-800">
                  Venue / Pitch
                </th>
                {datesList.map(day => (
                  <th key={day.isoStr} className="p-4 text-center border-r border-slate-800 last:border-r-0">
                    <span className="block text-sm font-semibold text-slate-200">{day.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPitches.length === 0 ? (
                <tr>
                  <td colSpan={datesList.length + 1} className="p-12 text-center text-slate-400">
                    No compatible pitches found. Try clearing filters.
                  </td>
                </tr>
              ) : (
                filteredPitches.map(pitch => {
                  const venueName = venues.find(v => v.id === pitch.venue)?.name || '';
                  return (
                    <React.Fragment key={pitch.id}>
                      {/* Morning Slot Row */}
                      <tr className="border-b border-slate-850 hover:bg-slate-800/10">
                        <td className="p-4 border-r border-slate-800 font-medium">
                          <span className="text-xs text-emerald-400 block font-display tracking-wide">{venueName}</span>
                          <span className="text-slate-100 font-semibold">{pitch.name}</span>
                          <span className="text-xxs text-slate-400 block mt-1 bg-slate-800/80 px-2 py-0.5 rounded w-max">
                            Morning (09:00 - 13:00)
                          </span>
                        </td>
                        {datesList.map(day => {
                          const cell = getCellStatus(pitch.id, day.isoStr, 'MORNING');
                          return (
                            <td 
                              key={day.isoStr} 
                              className="p-2 border-r border-slate-800 last:border-r-0 h-24 align-top"
                            >
                              <CellContent 
                                cell={cell} 
                                onClick={() => handleCellClick(pitch.id, day.isoStr, 'MORNING', cell)} 
                              />
                            </td>
                          );
                        })}
                      </tr>
                      {/* Afternoon Slot Row */}
                      <tr className="border-b border-slate-850 hover:bg-slate-800/10 last:border-b-0">
                        <td className="p-4 border-r border-slate-800 font-medium">
                          <span className="text-xs text-emerald-400 block font-display tracking-wide">{venueName}</span>
                          <span className="text-slate-100 font-semibold">{pitch.name}</span>
                          <span className="text-xxs text-slate-400 block mt-1 bg-slate-800/80 px-2 py-0.5 rounded w-max">
                            Afternoon (13:30 - 18:00)
                          </span>
                        </td>
                        {datesList.map(day => {
                          const cell = getCellStatus(pitch.id, day.isoStr, 'AFTERNOON');
                          return (
                            <td 
                              key={day.isoStr} 
                              className="p-2 border-r border-slate-800 last:border-r-0 h-24 align-top"
                            >
                              <CellContent 
                                cell={cell} 
                                onClick={() => handleCellClick(pitch.id, day.isoStr, 'AFTERNOON', cell)} 
                              />
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold font-display text-slate-100">Request Pitch Booking</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pitch</label>
                  <select
                    value={modalData.pitchId}
                    onChange={(e) => setModalData({ ...modalData, pitchId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">Select Pitch</option>
                    {pitches.map(p => (
                      <option key={p.id} value={p.id}>
                        {venues.find(v => v.id === p.venue)?.name} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Time Slot</label>
                  <select
                    value={modalData.timeSlot}
                    onChange={(e) => setModalData({ ...modalData, timeSlot: e.target.value })}
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Team (Requesting)</label>
                <select
                  value={modalData.teamId}
                  onChange={(e) => setModalData({ ...modalData, teamId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select Your Team</option>
                  {teams.filter(t => !t.is_external).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Opponent</label>
                <input
                  type="text"
                  value={modalData.opponent}
                  onChange={(e) => setModalData({ ...modalData, opponent: e.target.value })}
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
                      onChange={(e) => setModalData({ ...modalData, isMultiDay: e.target.checked })}
                      className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                    />
                    <label htmlFor="isMultiDay" className="text-sm font-medium text-slate-200">Multi-Day Booking</label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      {modalData.isMultiDay ? 'Start Date' : 'Date'}
                    </label>
                    <input
                      type="date"
                      value={modalData.date}
                      onChange={(e) => setModalData({ ...modalData, date: e.target.value, endDate: modalData.isMultiDay ? modalData.endDate : e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  {modalData.isMultiDay && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">End Date</label>
                      <input
                        type="date"
                        value={modalData.endDate}
                        onChange={(e) => setModalData({ ...modalData, endDate: e.target.value })}
                        min={modalData.date}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-6 bg-slate-800/20 p-3.5 rounded-xl border border-slate-800/60 justify-around">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalData.requiresTeas}
                    onChange={(e) => setModalData({ ...modalData, requiresTeas: e.target.checked })}
                    className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-200">Request Teas</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalData.requiresDrinks}
                    onChange={(e) => setModalData({ ...modalData, requiresDrinks: e.target.checked })}
                    className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-200">Request Drinks</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes for Secretary</label>
                <textarea
                  value={modalData.notes}
                  onChange={(e) => setModalData({ ...modalData, notes: e.target.value })}
                  placeholder="Any special ground prep, cup rules, etc."
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-550/20 transition"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Inner helper component for cell mapping
function CellContent({ cell, onClick }) {
  if (!cell) {
    return (
      <button 
        onClick={onClick}
        className="w-full h-full flex items-center justify-center border border-dashed border-slate-800 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-950/25 group transition cursor-pointer"
      >
        <Plus size={16} className="text-slate-650 group-hover:text-emerald-400 group-hover:scale-110 transition duration-300" />
      </button>
    );
  }

  if (cell.type === 'BLOCKED') {
    return (
      <div 
        className="w-full h-full bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between"
        title={cell.reason}
      >
        <div className="flex items-center space-x-1 text-slate-500">
          <ShieldAlert size={14} className="shrink-0 text-amber-600" />
          <span className="text-xxs font-bold uppercase tracking-wider font-display">{cell.label}</span>
        </div>
        <span className="text-xxs text-slate-500 leading-snug">Outfield Overlap</span>
      </div>
    );
  }

  // BOOKED cell
  const isApproved = cell.status === 'APPROVED';
  
  return (
    <div className={`w-full h-full border rounded-xl p-2.5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 ${
      isApproved 
        ? 'bg-emerald-950/30 border-emerald-900/80 shadow-sm shadow-emerald-900/10' 
        : 'bg-amber-950/20 border-amber-900/50'
    }`}>
      <div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase font-display ${
            isApproved ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/50 text-amber-400'
          }`}>
            {isApproved ? 'Confirmed' : 'Pending'}
          </span>
        </div>
        <p className="text-xs font-semibold text-slate-200 line-clamp-2 leading-snug" title={cell.label}>
          {cell.label}
        </p>
      </div>
      
      {cell.booking.notes && (
        <span className="text-[10px] text-slate-450 line-clamp-1 italic">
          "{cell.booking.notes}"
        </span>
      )}
    </div>
  );
}
