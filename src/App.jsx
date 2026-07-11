import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import CalendarView from './components/CalendarView';
import SecretaryDashboard from './components/SecretaryDashboard';
import CatererDashboard from './components/CatererDashboard';
import PublicBookingForm from './components/PublicBookingForm';
import { Calendar, ShieldAlert, Utensils, FormInput, Activity, HelpCircle } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('calendar');
  const [loading, setLoading] = useState(true);

  // Core app data state
  const [venues, setVenues] = useState([]);
  const [pitches, setPitches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pitchLengths, setPitchLengths] = useState([]);

  // Fetch all initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [v, p, t, f, b, pl] = await Promise.all([
        api.getVenues(),
        api.getPitches(),
        api.getTeams(),
        api.getFixtures(),
        api.getBookings(),
        api.getPitchLengths()
      ]);
      setVenues(v);
      setPitches(p);
      setTeams(t);
      setFixtures(f);
      setBookings(b);
      setPitchLengths(pl);
    } catch (err) {
      console.error("Failed to load core data: ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handler to submit booking request
  const handleBookingCreated = async (payload) => {
    // If it's a club booking, we also generate a fixture locally or in mock
    let fixId = null;
    if (payload.fixture_team) {
      // Internal booking
      const newFixture = {
        id: fixtures.length + 1,
        team: payload.fixture_team,
        opponent: payload.fixture_opponent,
        start_date: payload.start_date,
        end_date: payload.end_date,
        play_cricket_id: null
      };
      setFixtures(prev => [...prev, newFixture]);
      fixId = newFixture.id;
    }

    const bookingData = {
      fixture: fixId,
      pitch: payload.pitch,
      start_date: payload.start_date,
      end_date: payload.end_date,
      time_slot: payload.time_slot,
      requires_teas: payload.requires_teas,
      requires_drinks: payload.requires_drinks,
      requested_by: payload.fixture_team ? 2 : null, // Simulate Manager ID 2 for internal
      external_contact_name: payload.external_contact_name || '',
      external_contact_email: payload.external_contact_email || '',
      status: 'PENDING',
      notes: payload.notes || ''
    };

    const newBooking = await api.createBooking(bookingData);
    // Add to list and sync
    setBookings(prev => [...prev, newBooking]);
    // Force refetch to sync all states
    await loadData();
  };

  // Handler to approve/deny booking request
  const handleBookingStatusUpdate = async (id, status) => {
    const updated = await api.updateBookingStatus(id, status);
    if (updated) {
      await loadData();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Premium Header/Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-bold font-display text-lg text-slate-950">
              PW
            </div>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight text-slate-100 flex items-center gap-1.5">
                PitchWiz
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-900/40">
                  v1.0
                </span>
              </h1>
              <p className="text-xs text-slate-400">Cricket Club Pitch Booking System</p>
            </div>
          </div>

          {/* Navigation Views Switcher */}
          <nav className="flex space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-850">
            <button
              onClick={() => setActiveView('calendar')}
              className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition font-display ${
                activeView === 'calendar' 
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60' 
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              <Calendar size={14} />
              <span>Availability Calendar</span>
            </button>

            <button
              onClick={() => setActiveView('secretary')}
              className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition font-display relative ${
                activeView === 'secretary' 
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60' 
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              <ShieldAlert size={14} />
              <span>Secretary Panel</span>
              {bookings.filter(b => b.status === 'PENDING').length > 0 && (
                <span className="absolute -top-1.5 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveView('caterer')}
              className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition font-display ${
                activeView === 'caterer' 
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60' 
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              <Utensils size={14} />
              <span>Caterer Dashboard</span>
            </button>

            <button
              onClick={() => setActiveView('publicForm')}
              className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition font-display ${
                activeView === 'publicForm' 
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60' 
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              <FormInput size={14} />
              <span>Request Pitch</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main View Port */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Activity className="animate-spin text-emerald-400" size={36} />
            <p className="text-sm text-slate-405 font-display font-medium">Fetching PitchWiz live data...</p>
          </div>
        ) : (
          <div className="transition-all duration-300">
            {activeView === 'calendar' && (
              <CalendarView
                venues={venues}
                pitches={pitches}
                teams={teams}
                fixtures={fixtures}
                bookings={bookings}
                pitchLengths={pitchLengths}
                onBookingCreated={handleBookingCreated}
              />
            )}
            {activeView === 'secretary' && (
              <SecretaryDashboard
                venues={venues}
                pitches={pitches}
                teams={teams}
                fixtures={fixtures}
                bookings={bookings}
                pitchLengths={pitchLengths}
                onBookingStatusUpdate={handleBookingStatusUpdate}
              />
            )}
            {activeView === 'caterer' && (
              <CatererDashboard
                venues={venues}
                pitches={pitches}
                teams={teams}
                fixtures={fixtures}
                bookings={bookings}
              />
            )}
            {activeView === 'publicForm' && (
              <PublicBookingForm
                venues={venues}
                pitches={pitches}
                onBookingCreated={handleBookingCreated}
              />
            )}
          </div>
        )}
      </main>

      {/* Premium Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>&copy; 2026 PitchWiz. Designed for cricket club match efficiency.</span>
          <div className="flex space-x-4">
            <a href="file:///c:/Users/timsh/github/pitchwiz-backend/GEMINI.md" className="hover:text-emerald-400 transition">Backend Docs</a>
            <a href="file:///c:/Users/timsh/github/pitchwiz-frontend/GEMINI.md" className="hover:text-emerald-400 transition">Frontend Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
