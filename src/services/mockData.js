export const MOCK_PITCH_LENGTHS = [
  { id: 1, length_yards: 22, description: "22 Yards (Adults & U15+)" },
  { id: 2, length_yards: 19, description: "19 Yards (U12/U13)" },
  { id: 3, length_yards: 17, description: "17 Yards (U10/U11)" },
];

export const MOCK_VENUES = [
  { id: 1, name: "Main Ground" },
  { id: 2, name: "School Ground" },
];

export const MOCK_PITCHES = [
  {
    id: 1,
    venue: 1,
    name: "Main Grass",
    pitch_type: "GRASS",
    supported_lengths: [1],
    blocks_pitches: [2], // Blocks Pitch 2 (Outfield Astro)
    is_active: true,
  },
  {
    id: 2,
    venue: 1,
    name: "Outfield Astro",
    pitch_type: "ASTRO",
    supported_lengths: [2, 3],
    blocks_pitches: [],
    is_active: true,
  },
  {
    id: 3,
    venue: 2,
    name: "Pitch 1 (Grass)",
    pitch_type: "GRASS",
    supported_lengths: [1, 2],
    blocks_pitches: [],
    is_active: true,
  },
  {
    id: 4,
    venue: 2,
    name: "Pitch 2 (Astro)",
    pitch_type: "ASTRO",
    supported_lengths: [2, 3],
    blocks_pitches: [],
    is_active: true,
  },
];

export const MOCK_TEAMS = [
  { id: 1, name: "1st XI", manager: 2, required_length: 1, is_external: false },
  { id: 2, name: "2nd XI", manager: 2, required_length: 1, is_external: false },
  {
    id: 3,
    name: "U15s Boys",
    manager: 3,
    required_length: 1,
    is_external: false,
  },
  {
    id: 4,
    name: "U13s Boys",
    manager: 4,
    required_length: 2,
    is_external: false,
  },
  {
    id: 5,
    name: "U11s Mixed",
    manager: 5,
    required_length: 3,
    is_external: false,
  },
  {
    id: 6,
    name: "Dorset Cricket",
    manager: null,
    required_length: 1,
    is_external: true,
  },
  {
    id: 7,
    name: "Wessex Seniors",
    manager: null,
    required_length: 1,
    is_external: true,
  },
];

export const MOCK_FIXTURES = [
  {
    id: 1,
    team: 1,
    opponent: "Westbourne CC",
    start_date: "2026-07-11",
    end_date: "2026-07-11",
    play_cricket_id: "PC1001",
  },
  {
    id: 2,
    team: 2,
    opponent: "Broadstone CC",
    start_date: "2026-07-11",
    end_date: "2026-07-11",
    play_cricket_id: "PC1002",
  },
  {
    id: 3,
    team: 4,
    opponent: "Poole Town CC",
    start_date: "2026-07-12",
    end_date: "2026-07-12",
    play_cricket_id: "PC1003",
  },
  {
    id: 4,
    team: 3,
    opponent: "Wimborne CC",
    start_date: "2026-07-15",
    end_date: "2026-07-15",
    play_cricket_id: "PC1004",
  },
  {
    id: 5,
    team: 6,
    opponent: "Hampshire Seniors",
    start_date: "2026-07-18",
    end_date: "2026-07-20",
    play_cricket_id: null,
  }, // Multi-day
];

// Let's store bookings in memory to allow additions/updates in UI demo
export let mockBookings = [
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
    notes: "Requires covers if it rains on Friday night.",
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
    notes: "U13 cup game. Must finish by 1:00 PM.",
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
    notes: "Dorset U18s County Championship Match (3 days).",
  },
];

// Mutable copy of mock teams for local CRUD
export let mockTeamsList = [...MOCK_TEAMS];
export let mockTeamNextId = MOCK_TEAMS.length + 1;
