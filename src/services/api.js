// Clean API Service for PitchWiz
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (response.status === 401) {
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
}

export const api = {
  getMe: () => apiRequest("/api/users/me"),
  getVenues: () => apiRequest("/api/venues"),
  getPitches: () => apiRequest("/api/pitches"),
  getPitchLengths: () => apiRequest("/api/pitchlengths"),
  getTeams: () => apiRequest("/api/teams"),
  getFixtures: () => apiRequest("/api/fixtures"),
  createFixture: (data) =>
    apiRequest("/api/fixtures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  getBookings: () => apiRequest("/api/pitchbookings"),
  createBooking: (bookingData) =>
    apiRequest("/api/pitchbookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    }),

  changePassword: (data) =>
    apiRequest("/api/users/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  createTeam: (data) =>
    apiRequest("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  updateTeam: (id, data) =>
    apiRequest(`/api/teams/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteTeam: (id) =>
    apiRequest(`/api/teams/${id}`, {
      method: "DELETE",
    }),

  createVenue: (data) =>
    apiRequest("/api/venues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  updateVenue: (id, data) =>
    apiRequest(`/api/venues/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteVenue: (id) =>
    apiRequest(`/api/venues/${id}`, {
      method: "DELETE",
    }),

  createPitch: (data) =>
    apiRequest("/api/pitches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  updatePitch: (id, data) =>
    apiRequest(`/api/pitches/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deletePitch: (id) =>
    apiRequest(`/api/pitches/${id}`, {
      method: "DELETE",
    }),

  createPitchLength: (data) =>
    apiRequest("/api/pitchlengths", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  updatePitchLength: (id, data) =>
    apiRequest(`/api/pitchlengths/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deletePitchLength: (id) =>
    apiRequest(`/api/pitchlengths/${id}`, {
      method: "DELETE",
    }),

  updateBookingStatus: (id, status, rejectionReason = "") =>
    apiRequest(`/api/pitchbookings/${id}/update-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        ...(rejectionReason ? { rejection_reason: rejectionReason } : {}),
      }),
    }),
  updateBooking: (id, data) =>
    apiRequest(`/api/pitchbookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteBooking: (id) =>
    apiRequest(`/api/pitchbookings/${id}`, {
      method: "DELETE",
    }),

  importFixtures: (data) =>
    apiRequest("/api/fixtures/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  syncPlayCricketFixtures: (season) =>
    apiRequest("/api/fixtures/sync-play-cricket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season }),
    }),
};