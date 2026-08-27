import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import CalendarView from './components/CalendarView';
import SecretaryDashboard from './components/SecretaryDashboard';
import CatererDashboard from './components/CatererDashboard';
import PublicBookingForm from './components/PublicBookingForm';
import TeamsManager from './components/TeamsManager';
import UserManagement from './components/UserManagement';
import VenuesManager from './components/VenuesManager';
import { LoginScreen, ForcePasswordResetScreen } from './components/AuthScreens';
import { Calendar, ShieldAlert, Utensils, FormInput, Activity, HelpCircle, Users, LogOut, Shield, MapPin } from 'lucide-react';
import ChangePasswordModal from './components/ChangePasswordModal';
import { Lock } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

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

  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));
  const [isForceReset, setIsForceReset] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Fetch all initial data
  const loadData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [v, p, t, f, b, pl, me] = await Promise.all([
        api.getVenues(),
        api.getPitches(),
        api.getTeams(),
        api.getFixtures(),
        api.getBookings(),
        api.getPitchLengths(),
        api.getMe ? api.getMe() : fetch(`${API_BASE_URL}/api/users/me/`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } }).then(res => res.json())
      ]);
      setVenues(v);
      setPitches(p);
      setTeams(t);
      setFixtures(f);
      setBookings(b);
      setPitchLengths(pl);
      setCurrentUser(me);
    } catch (err) {
      console.error("Failed to load core data: ", err);
    } finally {
      setLoading(false);
    }
  };

  // Safeguard: Automatically redirect to calendar if user lacks permission for the active view
  useEffect(() => {
    if (loading || !currentUser) return;

    const restrictedViews = {
      secretary: hasRole('FIXTURE_SECRETARY'),
      caterer: hasRole('CATERER'),
      publicForm: hasRole('EXTERNAL'),
      teams: hasRole('USER_MANAGER') || hasRole('FIXTURE_SECRETARY'),
      venues: hasRole('USER_MANAGER') || hasRole('FIXTURE_SECRETARY'),
      users: hasRole('USER_MANAGER') || hasRole('ADMIN'),
    };

    // If the active view is restricted and the user doesn't have access, force 'calendar'
    if (restrictedViews[activeView] === false) {
      setActiveView('calendar');
    }
  }, [activeView, currentUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setIsAuthenticated(false);
    };
    const handleForceReset = () => setIsForceReset(true);

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    window.addEventListener('auth-force-reset', handleForceReset);

    if (isAuthenticated) {
      loadData();
    } else {
      setLoading(false);
    }

    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
      window.removeEventListener('auth-force-reset', handleForceReset);
    };
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setActiveView('calendar');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveView('calendar');
  };

  // Handler to submit booking request
  const handleBookingCreated = async (payload) => {
    // If it's a club booking, we also generate a fixture locally or in mock
    let fixId = null;
    if (payload.fixture_team) {
      // Internal booking - create fixture on backend
      const newFixtureData = {
        team: payload.fixture_team,
        opponent: payload.fixture_opponent,
        start_date: payload.start_date,
        end_date: payload.end_date,
      };
      const createdFixture = await api.createFixture(newFixtureData);
      fixId = createdFixture.id;
    }

    // Determine initial booking status: auto-approve if requested by Fixture Secretary or Admin
    const isAutoApproved = currentUser?.roles?.includes('ADMIN') || currentUser?.roles?.includes('FIXTURE_SECRETARY');
    const initialStatus = isAutoApproved ? 'APPROVED' : 'PENDING';

    const bookingData = {
      fixture: fixId,
      pitch: payload.pitch,
      start_date: payload.start_date,
      end_date: payload.end_date,
      time_slot: payload.time_slot,
      requires_teas: payload.requires_teas,
      requires_drinks: payload.requires_drinks,
      requested_by: currentUser ? currentUser.id : null,
      external_contact_name: payload.external_contact_name || '',
      external_contact_email: payload.external_contact_email || '',
      status: initialStatus,
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

  // Handler to update (edit) a booking's details
  const handleBookingUpdated = async (id, data) => {
    await api.updateBooking(id, data);
    await loadData();
  };

  // Handler to cancel/delete a booking
  const handleBookingDeleted = async (id) => {
    await api.deleteBooking(id);
    await loadData();
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (isForceReset) {
    return <ForcePasswordResetScreen onResetSuccess={() => setIsForceReset(false)} onCancel={handleLogout} />;
  }

  const hasRole = (role) => currentUser?.roles?.includes(role) || currentUser?.roles?.includes('ADMIN');

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Premium Header/Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          <nav className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveView('calendar')}
              className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition font-display ${activeView === 'calendar'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                : 'text-slate-450 hover:text-emerald-400'
                }`}
            >
              <Calendar size={14} />
              <span>Availability</span>
            </button>

            {hasRole('FIXTURE_SECRETARY') && (
              <button
                onClick={() => setActiveView('secretary')}
                className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition font-display ${activeView === 'secretary'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-450 hover:text-emerald-400'
                  }`}
              >
                <ShieldAlert size={14} />
                <span>Secretary Panel</span>
              </button>
            )}

            {hasRole('CATERER') && (
              <button
                onClick={() => setActiveView('caterer')}
                className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition font-display ${activeView === 'caterer'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-450 hover:text-emerald-400'
                  }`}
              >
                <Utensils size={14} />
                <span>Caterer Dashboard</span>
              </button>
            )}

            {/* {(hasRole('TEAM_MANAGER') || hasRole('FIXTURE_SECRETARY') || hasRole('ADMIN')) && (
              <button
                onClick={() => setActiveView('calendar')}
                className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition font-display ${activeView === 'calendar'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-450 hover:text-emerald-400'
                  }`}
              >
                <FormInput size={14} />
                <span>Request Pitch</span>
              </button>
            )} */}

            {hasRole('EXTERNAL') && (
              <button
                onClick={() => setActiveView('publicForm')}
                className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition font-display ${activeView === 'publicForm'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-450 hover:text-emerald-400'
                  }`}
              >
                <FormInput size={14} />
                <span>External Pitch Request</span>
              </button>
            )}

            {(hasRole('USER_MANAGER') || hasRole('FIXTURE_SECRETARY')) && (
              <button
                onClick={() => setActiveView('teams')}
                className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition font-display ${activeView === 'teams'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-450 hover:text-emerald-400'
                  }`}
              >
                <Users size={14} />
                <span>Teams</span>
              </button>
            )}

            {(hasRole('USER_MANAGER') || hasRole('FIXTURE_SECRETARY')) && (
              <button
                onClick={() => setActiveView('venues')}
                className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition font-display ${activeView === 'venues'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-450 hover:text-emerald-400'
                  }`}
              >
                <MapPin size={14} />
                <span>Venues & Pitches</span>
              </button>
            )}

            {(hasRole('USER_MANAGER') || hasRole('ADMIN')) && (
              <button
                onClick={() => setActiveView('users')}
                className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition font-display ${activeView === 'users'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-450 hover:text-emerald-400'
                  }`}
              >
                <Shield size={14} />
                <span>Users</span>
              </button>
            )}
            <button
              onClick={() => setIsPasswordModalOpen(true)}

              className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition font-display text-slate-450 hover:text-emerald-400`}
            >
              <Lock size={14} />
              <span>Password</span>
            </button>
            <button
              onClick={handleLogout}
              className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition font-display text-slate-450 hover:text-red-400`}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main View Port */}
      <main className="flex-grow max-w-[1600px] w-full mx-auto px-6 py-8">
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
                onBookingUpdated={handleBookingUpdated}
                onBookingDeleted={handleBookingDeleted}
                currentUser={currentUser}
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
                onBookingUpdated={handleBookingUpdated}
                onBookingDeleted={handleBookingDeleted}
                currentUser={currentUser}
              />
            )}
            {activeView === 'caterer' && (
              <CatererDashboard
                venues={venues}
                pitches={pitches}
                teams={teams}
                fixtures={fixtures}
                bookings={bookings}
                currentUser={currentUser}
              />
            )}
            {activeView === 'publicForm' && (
              <PublicBookingForm
                venues={venues}
                pitches={pitches}
                onBookingCreated={handleBookingCreated}
              />
            )}
            {activeView === 'teams' && (
              <TeamsManager
                teams={teams}
                pitchLengths={pitchLengths}
                onTeamsChanged={loadData}
              />
            )}
            {activeView === 'venues' && (
              <VenuesManager
                venues={venues}
                pitches={pitches}
                pitchLengths={pitchLengths}
                onDataChanged={loadData}
              />
            )}
            {activeView === 'users' && (
              <UserManagement />
            )}
          </div>
        )}
      </main>

      {/* Premium Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>&copy; 2026 PitchWiz. Designed for cricket club match efficiency.</span>
          <div className="flex space-x-4">
            <a href="file:///c:/Users/timsh/github/pitchwiz-backend/GEMINI.md" className="hover:text-emerald-400 transition">Backend Docs</a>
            <a href="file:///c:/Users/timsh/github/pitchwiz-frontend/GEMINI.md" className="hover:text-emerald-400 transition">Frontend Docs</a>
          </div>
        </div>
      </footer>

      {/* Password Reset Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
