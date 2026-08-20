// API and Mock Data Service for PitchWiz

const MOCK_PITCH_LENGTHS = [
  { id: 1, length_yards: 22, description: "22 Yards (Adults & U15+)" },
  { id: 2, length_yards: 19, description: "19 Yards (U12/U13)" },
  { id: 3, length_yards: 17, description: "17 Yards (U10/U11)" },
];

const MOCK_VENUES = [
  { id: 1, name: "Main Ground" },
  { id: 2, name: "School Ground" },
];

const MOCK_PITCHES = [
  { 
    id: 1, 
    venue: 1, 
    name: "Main Grass", 
    pitch_type: "GRASS", 
    supported_lengths: [1], 
    blocks_pitches: [2], // Blocks Pitch 2 (Outfield Astro)
    is_active: true 
  },
  { 
    id: 2, 
    venue: 1, 
    name: "Outfield Astro", 
    pitch_type: "ASTRO", 
    supported_lengths: [2, 3], 
    blocks_pitches: [], 
    is_active: true 
  },
  { 
    id: 3, 
    venue: 2, 
    name: "Pitch 1 (Grass)", 
    pitch_type: "GRASS", 
    supported_lengths: [1, 2], 
    blocks_pitches: [], 
    is_active: true 
  },
  { 
    id: 4, 
    venue: 2, 
    name: "Pitch 2 (Astro)", 
    pitch_type: "ASTRO", 
    supported_lengths: [2, 3], 
    blocks_pitches: [], 
    is_active: true 
  },
];

const MOCK_TEAMS = [
  { id: 1, name: "1st XI", manager: 2, required_length: 1, is_external: false },
  { id: 2, name: "2nd XI", manager: 2, required_length: 1, is_external: false },
  { id: 3, name: "U15s Boys", manager: 3, required_length: 1, is_external: false },
  { id: 4, name: "U13s Boys", manager: 4, required_length: 2, is_external: false },
  { id: 5, name: "U11s Mixed", manager: 5, required_length: 3, is_external: false },
  { id: 6, name: "Dorset Cricket", manager: null, required_length: 1, is_external: true },
  { id: 7, name: "Wessex Seniors", manager: null, required_length: 1, is_external: true },
];

const MOCK_FIXTURES = [
  { id: 1, team: 1, opponent: "Westbourne CC", start_date: "2026-07-11", end_date: "2026-07-11", play_cricket_id: "PC1001" },
  { id: 2, team: 2, opponent: "Broadstone CC", start_date: "2026-07-11", end_date: "2026-07-11", play_cricket_id: "PC1002" },
  { id: 3, team: 4, opponent: "Poole Town CC", start_date: "2026-07-12", end_date: "2026-07-12", play_cricket_id: "PC1003" },
  { id: 4, team: 3, opponent: "Wimborne CC", start_date: "2026-07-15", end_date: "2026-07-15", play_cricket_id: "PC1004" },
  { id: 5, team: 6, opponent: "Hampshire Seniors", start_date: "2026-07-18", end_date: "2026-07-20", play_cricket_id: null }, // Multi-day
];

// Let's store bookings in memory to allow additions/updates in UI demo
let mockBookings = [
  {
    id: 1,
    fixture: 1,
    pitch: 1,
    start_date: "2026-07-11",
    end_date: "2026-07-11",
    time_slot: "AFTERNOON",
    requires_teas: true,
    requires_drinks: true,
    requested_by: 2,
    external_contact_name: "",
    external_contact_email: "",
    status: "APPROVED",
    notes: "Requires covers if it rains on Friday night."
  },
  {
    id: 2,
    fixture: 3,
    pitch: 2,
    start_date: "2026-07-12",
    end_date: "2026-07-12",
    time_slot: "MORNING",
    requires_teas: false,
    requires_drinks: true,
    requested_by: 4,
    external_contact_name: "",
    external_contact_email: "",
    status: "PENDING",
    notes: "U13 cup game. Must finish by 1:00 PM."
  },
  {
    id: 3,
    fixture: 5,
    pitch: 1,
    start_date: "2026-07-18",
    end_date: "2026-07-20",
    time_slot: "ALL_DAY",
    requires_teas: true,
    requires_drinks: true,
    requested_by: null,
    external_contact_name: "Sarah Miller",
    external_contact_email: "sarah@dorsetcricket.co.uk",
    status: "PENDING",
    notes: "Dorset U18s County Championship Match (3 days)."
  }
];

// Mutable copy of mock teams for local CRUD
let mockTeamsList = [...MOCK_TEAMS];
let mockTeamNextId = MOCK_TEAMS.length + 1;

// Helper to make API calls with fallback to mock data
async function apiRequest(endpoint, options = {}) {
  try {
    const token = localStorage.getItem('access_token');
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }

    const response = await fetch(endpoint, options);
    
    if (response.status === 401) {
        // TODO: Handle token refresh logic
        window.dispatchEvent(new Event('auth-unauthorized'));
    }
    if (response.status === 403) {
      const errData = await response.json().catch(() => ({}));
      if (errData.code === 'FORCE_RESET' || errData.code === 'PASSWORD_EXPIRED') {
        window.dispatchEvent(new CustomEvent('auth-force-reset', { detail: errData.code }));
      }
      throw new Error(`HTTP 403 Forbidden: ${errData.detail || 'Access denied'}`);
    }

    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errData = await response.json();
        errorMsg += ` - Details: ${JSON.stringify(errData)}`;
      } catch (e) {
        // Ignore json parse error if body is empty or not json
      }
      throw new Error(errorMsg);
    }
    // DELETE returns 204 No Content
    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.warn(`API call failed for ${endpoint}. Falling back to mock data.`, error.message);
    
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 150));

    if (endpoint.includes('/venues')) return MOCK_VENUES;
    if (endpoint.includes('/pitchlengths')) return MOCK_PITCH_LENGTHS;

    // Teams CRUD mock fallback
    if (endpoint.includes('/teams')) {
      if (options.method === 'POST') {
        const body = JSON.parse(options.body);
        const newTeam = { id: mockTeamNextId++, ...body };
        mockTeamsList.push(newTeam);
        return newTeam;
      }
      if (options.method === 'PUT' || options.method === 'PATCH') {
        const idMatch = endpoint.match(/\/teams\/(\d+)/);
        if (idMatch) {
          const id = parseInt(idMatch[1], 10);
          const idx = mockTeamsList.findIndex(t => t.id === id);
          if (idx !== -1) {
            const body = JSON.parse(options.body);
            mockTeamsList[idx] = { ...mockTeamsList[idx], ...body };
            return mockTeamsList[idx];
          }
        }
        return null;
      }
      if (options.method === 'DELETE') {
        const idMatch = endpoint.match(/\/teams\/(\d+)/);
        if (idMatch) {
          const id = parseInt(idMatch[1], 10);
          mockTeamsList = mockTeamsList.filter(t => t.id !== id);
        }
        return null;
      }
      return mockTeamsList;
    }

    if (endpoint.includes('/pitches')) return MOCK_PITCHES;
    if (endpoint.includes('/fixtures')) {
      if (options.method === 'POST') {
        const body = JSON.parse(options.body);
        // Mutable mock fixtures array support
        if (!window.mockFixturesList) window.mockFixturesList = [...MOCK_FIXTURES];
        const newFix = { id: window.mockFixturesList.length + 1, ...body };
        window.mockFixturesList.push(newFix);
        return newFix;
      }
      return window.mockFixturesList || MOCK_FIXTURES;
    }
    if (endpoint.includes('/pitchbookings')) {
      if (options.method === 'POST') {
        const body = JSON.parse(options.body);
        const newBooking = {
          id: mockBookings.length + 1,
          status: 'PENDING',
          ...body
        };
        mockBookings.push(newBooking);
        return newBooking;
      }
      return mockBookings;
    }
    throw error;
  }
}

export const api = {
  getVenues: () => apiRequest('/api/venues/'),
  getPitches: () => apiRequest('/api/pitches/'),
  getPitchLengths: () => apiRequest('/api/pitchlengths/'),
  getTeams: () => apiRequest('/api/teams/'),
  getFixtures: () => apiRequest('/api/fixtures/'),
  createFixture: (data) => apiRequest('/api/fixtures/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  getBookings: () => apiRequest('/api/pitchbookings/'),
  createBooking: (bookingData) => apiRequest('/api/pitchbookings/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  }),
  // Team CRUD
  createTeam: (data) => apiRequest('/api/teams/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateTeam: (id, data) => apiRequest(`/api/teams/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteTeam: (id) => apiRequest(`/api/teams/${id}/`, {
    method: 'DELETE',
  }),

  // Venue CRUD
  createVenue: (data) => apiRequest('/api/venues/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateVenue: (id, data) => apiRequest(`/api/venues/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteVenue: (id) => apiRequest(`/api/venues/${id}/`, {
    method: 'DELETE',
  }),

  // Pitch CRUD
  createPitch: (data) => apiRequest('/api/pitches/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updatePitch: (id, data) => apiRequest(`/api/pitches/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deletePitch: (id) => apiRequest(`/api/pitches/${id}/`, {
    method: 'DELETE',
  }),

  // PitchLength CRUD
  createPitchLength: (data) => apiRequest('/api/pitchlengths/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updatePitchLength: (id, data) => apiRequest(`/api/pitchlengths/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deletePitchLength: (id) => apiRequest(`/api/pitchlengths/${id}/`, {
    method: 'DELETE',
  }),

  // Local-only update for mock data (to show live feedback in dashboards)
  updateBookingStatus: (id, status) => apiRequest(`/api/pitchbookings/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }),
};
