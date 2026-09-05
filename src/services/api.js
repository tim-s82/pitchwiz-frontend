// API and Mock Data Service for PitchWiz
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://[IP_ADDRESS]";

// Helper to make API calls with fallback to mock data
async function apiRequest(endpoint, options = {}) {
  try {
    const token = localStorage.getItem("access_token");
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (response.status === 401) {
      // TODO: Handle token refresh logic
      window.dispatchEvent(new Event("auth-unauthorized"));
    }
    if (response.status === 403) {
      const errData = await response.json().catch(() => ({}));
      if (
        errData.code === "FORCE_RESET" ||
        errData.code === "PASSWORD_EXPIRED"
      ) {
        window.dispatchEvent(
          new CustomEvent("auth-force-reset", { detail: errData.code }),
        );
      }
      throw new Error(
        `HTTP 403 Forbidden: ${errData.detail || "Access denied"}`,
      );
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
    console.warn(`API call failed for ${endpoint}.`, error.message);

    // Simulate latency
    await new Promise((resolve) => setTimeout(resolve, 150));

    if (endpoint.includes("/venues")) return MOCK_VENUES;
    if (endpoint.includes("/pitchlengths")) return MOCK_PITCH_LENGTHS;

    // Teams CRUD mock fallback
    if (endpoint.includes("/teams")) {
      if (options.method === "POST") {
        const body = JSON.parse(options.body);
        const newTeam = { id: mockTeamNextId++, ...body };
        mockTeamsList.push(newTeam);
        return newTeam;
      }
      if (options.method === "PUT" || options.method === "PATCH") {
        const idMatch = endpoint.match(/\/teams\/(\d+)/);
        if (idMatch) {
          const id = parseInt(idMatch[1], 10);
          const idx = mockTeamsList.findIndex((t) => t.id === id);
          if (idx !== -1) {
            const body = JSON.parse(options.body);
            mockTeamsList[idx] = { ...mockTeamsList[idx], ...body };
            return mockTeamsList[idx];
          }
        }
        return null;
      }
      if (options.method === "DELETE") {
        const idMatch = endpoint.match(/\/teams\/(\d+)/);
        if (idMatch) {
          const id = parseInt(idMatch[1], 10);
          mockTeamsList = mockTeamsList.filter((t) => t.id !== id);
        }
        return null;
      }
      return mockTeamsList;
    }

    if (endpoint.includes("/pitches")) return MOCK_PITCHES;
    if (endpoint.includes("/fixtures")) {
      if (options.method === "POST") {
        const body = JSON.parse(options.body);
        // Mutable mock fixtures array support
        if (!window.mockFixturesList)
          window.mockFixturesList = [...MOCK_FIXTURES];
        const newFix = { id: window.mockFixturesList.length + 1, ...body };
        window.mockFixturesList.push(newFix);
        return newFix;
      }
      return window.mockFixturesList || MOCK_FIXTURES;
    }
    if (endpoint.includes("/pitchbookings")) {
      if (options.method === "POST") {
        const body = JSON.parse(options.body);
        const newBooking = {
          id: mockBookings.length + 1,
          status: "PENDING",
          ...body,
        };
        mockBookings.push(newBooking);
        return newBooking;
      }
      if (options.method === "PATCH" || options.method === "PUT") {
        const idMatch = endpoint.match(/\/pitchbookings\/(\d+)/);
        if (idMatch) {
          const id = parseInt(idMatch[1], 10);
          const idx = mockBookings.findIndex((b) => b.id === id);
          if (idx !== -1) {
            const body = JSON.parse(options.body);
            mockBookings[idx] = { ...mockBookings[idx], ...body };
            return mockBookings[idx];
          }
        }
        return null;
      }
      if (options.method === "DELETE") {
        const idMatch = endpoint.match(/\/pitchbookings\/(\d+)/);
        if (idMatch) {
          const id = parseInt(idMatch[1], 10);
          mockBookings = mockBookings.filter((b) => b.id !== id);
        }
        return null;
      }
      return mockBookings;
    }
    throw error;
  }
}

export const api = {
  getMe: () => apiRequest("/api/users/me/"),
  getVenues: () => apiRequest("/api/venues/"),
  getPitches: () => apiRequest("/api/pitches/"),
  getPitchLengths: () => apiRequest("/api/pitchlengths/"),
  getTeams: () => apiRequest("/api/teams/"),
  getFixtures: () => apiRequest("/api/fixtures/"),
  createFixture: (data) =>
    apiRequest("/api/fixtures/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  getBookings: () => apiRequest("/api/pitchbookings/"),
  createBooking: (bookingData) =>
    apiRequest("/api/pitchbookings/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    }),

  // Change Password
  changePassword: (data) =>
    apiRequest("/api/users/change-password/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // Team CRUD
  createTeam: (data) =>
    apiRequest("/api/teams/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  updateTeam: (id, data) =>
    apiRequest(`/api/teams/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteTeam: (id) =>
    apiRequest(`/api/teams/${id}/`, {
      method: "DELETE",
    }),

  // Venue CRUD
  createVenue: (data) =>
    apiRequest("/api/venues/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  updateVenue: (id, data) =>
    apiRequest(`/api/venues/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteVenue: (id) =>
    apiRequest(`/api/venues/${id}/`, {
      method: "DELETE",
    }),

  // Pitch CRUD
  createPitch: (data) =>
    apiRequest("/api/pitches/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  updatePitch: (id, data) =>
    apiRequest(`/api/pitches/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deletePitch: (id) =>
    apiRequest(`/api/pitches/${id}/`, {
      method: "DELETE",
    }),

  // PitchLength CRUD
  createPitchLength: (data) =>
    apiRequest("/api/pitchlengths/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  updatePitchLength: (id, data) =>
    apiRequest(`/api/pitchlengths/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deletePitchLength: (id) =>
    apiRequest(`/api/pitchlengths/${id}/`, {
      method: "DELETE",
    }),

  // Fixture secretary status update via dedicated action endpoint
  updateBookingStatus: (id, status, rejectionReason = "") =>
    apiRequest(`/api/pitchbookings/${id}/update-status/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        ...(rejectionReason ? { rejection_reason: rejectionReason } : {}),
      }),
    }),
  updateBooking: (id, data) =>
    apiRequest(`/api/pitchbookings/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteBooking: (id) =>
    apiRequest(`/api/pitchbookings/${id}/`, {
      method: "DELETE",
    }),

  // Fixture Import
  importFixtures: (data) =>
    apiRequest("/api/fixtures/import/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // Sync Play-Cricket Fixtures
  syncPlayCricketFixtures: (season) =>
    apiRequest("/api/fixtures/sync-play-cricket/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season }),
    }),
};