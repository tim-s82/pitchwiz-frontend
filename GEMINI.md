# Project: PitchWiz - Cricket Club Pitch Booking App (Frontend)

*For the original planning conversation, see the backend's [pitchwiz-plan.md](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-backend/pitchwiz-plan.md).*  
*For the UI Consistency Audit and design decisions log, see [myconversation.md](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/myconversation.md).*  
*For architecture audits and code review notes, see the backend's [design_review.md](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-backend/design_review.md).*  
*For UI style contracts, component architecture, and contributing guidelines, see [CONTRIBUTING.md](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/CONTRIBUTING.md).*

---

## 1. Project Purpose & Scope

The frontend of PitchWiz provides the modern, responsive web application for cricket club pitch booking, fixture scheduling, catering coordination, and grounds administration. It communicates with the Django REST Framework backend to fetch data, handle bookings, coordinate change requests, and provide an intuitive dark-mode interface for club managers and members.

**Key Stakeholders & Views:**
*   **Team Managers & Members:** Multi-venue interactive weekly calendar view with mobile-responsive stacked cards, booking request modal, and booking edit/cancel actions.
*   **Fixture Secretary:** Dedicated dashboard for reviewing pending bookings, handling schedule conflicts, approving/denying booking change requests, and managing club fixtures.
*   **Club Caterer:** Dedicated caterer screen to view fixture catering requirements (teas and drinks) and approve or decline requests.
*   **Groundstaff:** Dedicated maintenance mode to lock individual pitches or entire grounds for maintenance, renovations, or adverse weather.
*   **External Organizations:** Unauthenticated public booking form for third-party entities (e.g. Dorset Cricket) to request pitch hire.
*   **Club Administrators:** Management screens for Venues & Pitches (with outfield overlap rules), Teams, and Club Users.

---

## 2. Architectural & Tooling Decisions

*   **Framework:** React 19 Single Page Application (SPA) built with Vite.
*   **Styling:** Tailwind CSS v4 with custom dark-mode design tokens (Slate-950/900 palette, Emerald/Teal primary gradients, Amber warnings, and Rose/Red alerts).
*   **Iconography:** Lucide React with standardized 18px form/picker icons and 16px action buttons.
*   **Typography:** Google Fonts Outfit (`font-display`) for branding and headers; Inter (`font-sans`) for body and interface controls.
*   **API Client:** Centralized HTTP service in [src/services/api.js](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/services/api.js) handling JWT token injection, refresh lifecycle, and custom `auth-unauthorized` logout events.
*   **Hosting:** Hosted on **Vercel** (`https://pitchwiz-frontend.vercel.app`), consuming the Django backend on **Render**.
*   **Testing:** Vitest with MSW (Mock Service Worker) for API layer testing.

---

## 3. Implemented Features & Components

### Views & Management Modules
1. **Interactive Calendar (`CalendarView.jsx`)**:
   - Desktop 7-day venue/pitch availability grid with custom scrollbars and glassmorphism styling.
   - Responsive mobile view with stacked daily cards.
   - Visual outfield conflict warnings and auto-lock indicators for dependent youth pitches.
   - Decomposed sub-components in `components/calendar/`:
     - [CalendarToolbar.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/calendar/CalendarToolbar.jsx)
     - [CellContent.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/calendar/CellContent.jsx)
     - [BookingCreateModal.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/calendar/BookingCreateModal.jsx)
     - [BookingEditModal.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/calendar/BookingEditModal.jsx)
     - Custom hooks: [useCalendarState.js](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/calendar/useCalendarState.js), [useConflictDetection.js](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/calendar/useConflictDetection.js).

2. **Fixture Secretary Dashboard (`SecretaryDashboard.jsx`)**:
   - Pending booking approval queue with instant conflict detection.
   - Sub-components in `components/secretary/`:
     - [ChangeRequestsTab.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/secretary/ChangeRequestsTab.jsx)
     - [ConfirmApproveModal.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/secretary/ConfirmApproveModal.jsx)
     - [RejectModal.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/secretary/RejectModal.jsx)
     - [BookingEditModal.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/secretary/BookingEditModal.jsx)

3. **Caterer Dashboard (`CatererDashboard.jsx`)**:
   - Dedicated filterable dashboard for upcoming fixtures requiring teas or drinks.
   - Confirm or reject catering requests with notes.

4. **Ground Maintenance Mode (`GroundMaintenanceModal.jsx`)**:
   - Modal for locking pitches or grounds across custom date ranges for ground upkeep.

5. **Fixture Import & Play-Cricket Sync**:
   - **Play-Cricket Sync (`PlayCricketSyncManager.jsx`)**: Connects to Play-Cricket API, matches teams with fuzzy algorithms, previews sync, and bulk commits.
   - **Spreadsheet Fixture Import (`FixtureImportManager.jsx`)**: CSV upload with custom column mapping, duplicate detection, and batch import.

6. **Venues & Pitches Management (`VenuesManager.jsx`)**:
   - Decomposed sub-components in `components/venues/`:
     - [VenueForm.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/venues/VenueForm.jsx)
     - [PitchForm.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/venues/PitchForm.jsx)
     - [PitchLengthForm.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/venues/PitchLengthForm.jsx)
     - [DeleteConfirmModal.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/venues/DeleteConfirmModal.jsx)

7. **Teams Management (`TeamsManager.jsx`)**:
   - Manage internal/external teams, team manager assignments, and required pitch lengths.

8. **User & Access Management**:
   - [UserManagement.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/UserManagement.jsx): Assign roles, unlock locked accounts, trigger password resets.
   - [AuthScreens.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/AuthScreens.jsx): JWT login and mandatory forced password reset.
   - [ChangePasswordModal.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/ChangePasswordModal.jsx): Voluntary self-service password update.

9. **Public Booking Form (`PublicBookingForm.jsx`)**:
   - Public unauthenticated form for external pitch hire inquiries.

10. **Toast Notification System (`src/components/shared/Toast.jsx`)**:
    - Non-blocking notification banner replacing intrusive native browser alerts.

---

## 4. Engineering & Styling Guidelines

Refer to [CONTRIBUTING.md](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/CONTRIBUTING.md) for full instructions. Key rules for developers and agents:
1. **Strict UI Style Contract**:
   - Adhere to the Emerald/Teal primary accent gradient and Slate-950/900 dark theme.
   - Do not introduce arbitrary blue or indigo styling.
   - Use standard `rounded-xl` controls and `rounded-2xl` modals.
   - Standardize Lucide `<X size={18} />` with hover pill wrapper for modal close buttons.
   - Never use browser `alert()` or `confirm()`; use `Toast` or styled dialogs.
2. **Centralized API Client**:
   - All network calls must use [src/services/api.js](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/services/api.js).
3. **Decomposed Components**:
   - Keep components modular; place domain-specific modals and hooks into dedicated subfolders (`calendar/`, `secretary/`, `venues/`, `shared/`).
4. **Build & Test Gate**:
   - Ensure `npm run lint` and `npm test` pass before building or committing.
