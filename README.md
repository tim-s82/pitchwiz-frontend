# PitchWiz Frontend Client

The frontend single-page web application for **PitchWiz**, a cricket club pitch booking, fixture scheduling, and grounds management platform.

Built with React 19, Vite, and Tailwind CSS, the client provides a responsive, dark-mode user experience for team managers, fixture secretaries, club caterers, groundstaff, and the public.

---

## 1. Architecture & Hosting

- **Framework**: React 19 (SPA) with Vite bundler
- **Styling**: Tailwind CSS v4 with custom dark palette, `@tailwindcss/vite`, and Lucide React icons
- **Hosting**: Deployed on [Vercel](https://vercel.com) (`https://pitchwiz-frontend.vercel.app`)
- **Backend API**: Connects to the Django REST Framework API hosted on Render (`https://pitchwiz-backend.onrender.com` or local dev proxy)
- **State & Data Access**: Centralized API service (`src/services/api.js`) with JWT bearer token management, automatic session expiry detection, and custom hooks for calendar and conflict state
- **Testing**: Vitest with MSW (Mock Service Worker) for network mocking and React Testing Library

---

## 2. Key Dashboards & Views

- **Interactive Calendar View (`CalendarView.jsx`)**:
  - **Desktop Matrix**: Displays venues and pitches along the vertical axis with 7 days along the horizontal axis.
  - **Mobile Card View**: Responsive stacked view presenting daily pitch availability on mobile screens.
  - **Outfield Overlap Auto-Lock**: Visually highlights youth pitches locked due to adult pitch bookings with conflict warnings.
  - **Booking Modals**: Modular modals (`BookingCreateModal`, `BookingEditModal`) for scheduling fixtures, catering choices (teas/drinks), and multi-day spans.

- **Fixture Secretary Dashboard (`SecretaryDashboard.jsx`)**:
  - Unified queue for pending booking approvals and change requests.
  - Interactive conflict warning detection alerting secretaries before approval.
  - Tabbed interface with change request resolution (`ChangeRequestsTab.jsx`), approval modal (`ConfirmApproveModal.jsx`), and denial reasons (`RejectModal.jsx`).

- **Caterer Dashboard (`CatererDashboard.jsx`)**:
  - Filterable schedule of upcoming home fixtures requiring teas or drinks.
  - Direct status toggling to confirm or reject catering requests with notes.

- **Ground Maintenance Modal (`GroundMaintenanceModal.jsx`)**:
  - Allows groundstaff or secretaries to lock individual pitches or entire grounds across date ranges for pitch repair, top-dressing, or weather cancellations.

- **Fixture Import & Play-Cricket Sync**:
  - **Play-Cricket Sync (`PlayCricketSyncManager.jsx`)**: Connects to ECB Play-Cricket sites to fetch club fixtures, previews matches, runs fuzzy matching on teams and opponents, and commits bookings.
  - **Spreadsheet Fixture Import (`FixtureImportManager.jsx`)**: Parses CSV fixture schedules with customizable header mapping, detects scheduling conflicts, and batch-creates fixtures and bookings.

- **Venues & Pitches Management (`VenuesManager.jsx`)**:
  - Setup and edit grounds/venues, pitch types (grass, artificial), and entity classifications (Main, Youth, Outfield, Net).
  - Configure pitch lengths (e.g. 17, 19, 21, 22 yards).
  - Map outfield blocking relationships (`blocks_pitches`) between pitches.

- **Teams & Users Management**:
  - **Teams Manager (`TeamsManager.jsx`)**: Configure internal and external teams, specify required pitch lengths, and link team managers.
  - **User Management (`UserManagement.jsx`)**: Assign user roles, lock/unlock accounts, and force credential resets.

- **Public Booking Form (`PublicBookingForm.jsx`)**:
  - Clean, unauthenticated external form for outside bodies (such as county boards or schools) to request pitch hire with contact details.

- **Authentication & Security**:
  - JWT login screen with role routing.
  - Self-service password change modal (`ChangePasswordModal.jsx`).
  - Mandatory forced password reset screen for flagged accounts (`AuthScreens.jsx`).

---

## 3. Project Structure

```
pitchwiz-frontend/
├── index.html                   # HTML entry point (Outfit & Inter fonts loaded)
├── vite.config.js               # Vite configuration with Tailwind CSS plugin
├── package.json                 # Scripts, dependencies, devDependencies
├── CONTRIBUTING.md              # UI Style Contract, styling rules, component guidelines
├── src/
│   ├── main.jsx                 # React root mount
│   ├── App.jsx                  # Main navigation, auth state, and view routing
│   ├── index.css                # Tailwind imports, custom font variables, glassmorphism
│   ├── services/
│   │   └── api.js               # Centralized API service with JWT auth headers & events
│   ├── tests/
│   │   ├── api.test.js          # MSW tests for API client
│   │   ├── mockData.js          # Test fixtures
│   │   └── Footer.test.jsx
│   └── components/
│       ├── calendar/            # CalendarToolbar, BookingCreateModal, BookingEditModal, CellContent, hooks
│       ├── secretary/           # Secretary sub-tabs, RejectModal, ConfirmApproveModal, hooks
│       ├── venues/              # VenueForm, PitchForm, PitchLengthForm, DeleteConfirmModal
│       ├── shared/              # Toast notification system
│       ├── AuthScreens.jsx      # Login and forced password reset screens
│       ├── ChangePasswordModal.jsx
│       ├── CatererDashboard.jsx
│       ├── GroundMaintenanceModal.jsx
│       ├── FixtureImportManager.jsx
│       ├── PlayCricketSyncManager.jsx
│       ├── PublicBookingForm.jsx
│       ├── TeamsManager.jsx
│       ├── UserManagement.jsx
│       ├── VenuesManager.jsx
│       └── Footer.jsx
```

---

## 4. Local Development Setup

### Prerequisites
- Node.js 18+ (Node 20 or 22 recommended)
- npm or pnpm

### Installation

1. **Clone the repository and enter directory**:
   ```bash
   cd pitchwiz-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root:
   ```ini
   VITE_API_URL=http://127.0.0.1:8000
   ```
   (In production on Vercel, this points to your deployed Render backend URL).

4. **Start the local dev server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 5. Scripts & Quality Commands

- **Start Dev Server**:
  ```bash
  npm run dev
  ```
- **Run Linters**:
  ```bash
  npm run lint
  ```
- **Run Unit Tests**:
  ```bash
  npm test
  ```
- **Production Build (Gates on lint & test)**:
  ```bash
  npm run build
  ```
- **Preview Production Build**:
  ```bash
  npm run preview
  ```

---

## 6. Contributing & UI Style Contract

Please refer to [CONTRIBUTING.md](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/CONTRIBUTING.md) for the complete UI Style Contract, color tokens, button guidelines, modal styling standards, and API usage requirements.
