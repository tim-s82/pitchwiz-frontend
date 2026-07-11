import React, { useMemo } from 'react';
import { Coffee, ListCollapse, Utensils, Calendar, MapPin, Clock, FileText } from 'lucide-react';

export default function CatererDashboard({
  venues,
  pitches,
  teams,
  fixtures,
  bookings
}) {
  // Filter only APPROVED bookings that require teas or drinks
  const upcomingCatering = useMemo(() => {
    return bookings
      .filter(b => 
        b.status === 'APPROVED' && 
        (b.requires_teas || b.requires_drinks)
      )
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  }, [bookings]);

  // Aggregate stats
  const stats = useMemo(() => {
    let teasCount = 0;
    let drinksCount = 0;
    upcomingCatering.forEach(b => {
      if (b.requires_teas) teasCount++;
      if (b.requires_drinks) drinksCount++;
    });
    return { teasCount, drinksCount, total: upcomingCatering.length };
  }, [upcomingCatering]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
            <Utensils size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-slate-100 font-display">Caterer Dashboard</h2>
            <p className="text-sm text-slate-400">View upcoming food and beverage requests for confirmed matches.</p>
          </div>
        </div>
        
        {/* Caterer Summary Stats */}
        <div className="flex gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 flex items-center space-x-2">
            <Coffee className="text-emerald-400" size={18} />
            <div>
              <span className="block text-xxs font-bold text-slate-400 uppercase tracking-wider font-display">Teas Requested</span>
              <span className="text-lg font-bold text-slate-100">{stats.teasCount}</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 flex items-center space-x-2">
            <Coffee className="text-teal-400" size={18} />
            <div>
              <span className="block text-xxs font-bold text-slate-400 uppercase tracking-wider font-display">Drinks Requested</span>
              <span className="text-lg font-bold text-slate-100">{stats.drinksCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Catering Requests List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold font-display tracking-wide text-slate-200">Upcoming Orders</h3>
        
        {upcomingCatering.length === 0 ? (
          <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl">
            No catering requests for the upcoming scheduled matches.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingCatering.map(booking => {
              const pitchObj = pitches.find(p => p.id === booking.pitch);
              const venueObj = pitchObj ? venues.find(v => v.id === pitchObj.venue) : null;
              const fixtureObj = booking.fixture ? fixtures.find(f => f.id === booking.fixture) : null;
              const teamObj = fixtureObj ? teams.find(t => t.id === fixtureObj.team) : null;
              
              const fixtureLabel = teamObj 
                ? `${teamObj.name} vs ${fixtureObj.opponent}` 
                : booking.external_contact_name || 'External Match';

              return (
                <div key={booking.id} className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-100 leading-snug font-display text-base">{fixtureLabel}</h4>
                      
                      {/* Requirements indicators */}
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

                    {/* Meta information */}
                    <div className="space-y-1.5 text-xs text-slate-350">
                      <div className="flex items-center space-x-2">
                        <Calendar size={14} className="text-slate-500 shrink-0" />
                        <span>
                          {booking.start_date === booking.end_date 
                            ? booking.start_date 
                            : `${booking.start_date} to ${booking.end_date}`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin size={14} className="text-slate-500 shrink-0" />
                        <span>{venueObj?.name} &bull; {pitchObj?.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock size={14} className="text-slate-500 shrink-0" />
                        <span className="capitalize">{booking.time_slot.toLowerCase().replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes / Special Instructions */}
                  {booking.notes ? (
                    <div className="bg-slate-900/55 p-3 rounded-xl border border-slate-850 flex items-start space-x-2">
                      <FileText size={14} className="text-slate-450 mt-0.5 shrink-0" />
                      <div className="text-xxs text-slate-400 leading-normal">
                        <span className="font-bold text-slate-300 block mb-0.5 font-display">Notes/Dietary Info:</span>
                        "{booking.notes}"
                      </div>
                    </div>
                  ) : (
                    <div className="text-xxs text-slate-500 italic">No notes provided by requestor.</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
