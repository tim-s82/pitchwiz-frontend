# Project: PitchWiz - Cricket Club Pitch Booking App (Frontend)

*For the original planning conversation, see the backend's [pitchwiz-plan.md](file:///c:/Users/timsh/github/pitchwiz-backend/pitchwiz-plan.md).*
*For the backend configuration and database model details, see the backend's [GEMINI.md](file:///c:/Users/timsh/github/pitchwiz-backend/GEMINI.md).*

## 1. Project Purpose

The frontend of PitchWiz provides the interactive user interface for managing cricket pitch bookings. It communicates with the Django REST Framework backend to fetch data and request bookings, and displays them via a clean, responsive interface suitable for both mobile and desktop users.

**Key Dashboards & Views:**
*   **Interactive Calendar View:** A responsive calendar showing pitch availability across multiple venues and pitches.
*   **Fixture Secretary Dashboard:** For approving or denying pitch booking requests and handling conflicts.
*   **Caterer Dashboard:** A dedicated screen to view catering requirements (teas and drinks) for booked fixtures.
*   **External Booking Form:** A public-facing form for non-club entities (such as Dorset Cricket) to request pitches without requiring an account.

## 2. Architectural & Tooling Decisions

The frontend is structured as a separate application consuming the Django REST Framework API.

*   **Styling & Framework:** Tailwind CSS (configured in `package.json`).
*   **Interactivity:** Built to work on both mobile (stacked daily view) and desktop (weekly venue/pitch matrix).

## 3. Current Progress

The frontend project (`pitchwiz-frontend`) has been initialized.

*   **Configuration:** Tailwind CSS and PostCSS dependencies installed.
*   **Files:**
    *   [package.json](file:///c:/Users/timsh/github/pitchwiz-frontend/package.json)
    *   [.gitignore](file:///c:/Users/timsh/github/pitchwiz-frontend/.gitignore)

## 4. Next Steps & Future Considerations

*   Set up the build tool / bundler (e.g. Vite or simple static server structure).
*   Create the main HTML templates and UI layout.
*   Configure the styling using Tailwind CSS.
*   Implement JavaScript integration to fetch venues, pitches, and bookings from the backend API.
*   Develop the interactive calendar rendering logic.
*   Build the forms and dashboards (Fixture Secretary, Caterer, and Public Booking Form).
