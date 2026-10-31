# Contributing to PitchWiz Frontend

This guide documents the design system, architectural patterns, and engineering standards for the `pitchwiz-frontend` application. All contributors and AI coding agents must follow these guidelines to maintain a cohesive, high-quality dark-mode experience and reliable client architecture.

For historical review insights, see:
- [myconversation.md](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/myconversation.md): Complete UI Consistency Audit & decisions log.
- [design_review.md](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-backend/design_review.md): Frontend & backend architecture audit.

---

## 1. UI Style Contract

The PitchWiz interface uses a custom modern dark-mode aesthetic with an emerald/teal accent system. Consistency across controls is paramount.

### 1.1 Color System & Tokens

| Role | Palette / Tailwind Classes | Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `bg-slate-950` | Full page background |
| **Card / Panel Background** | `bg-slate-900` or `glass-panel` | Containers, modal bodies, table rows |
| **Borders** | `border-slate-800` (dividers) / `border-slate-700/60` (inputs) | Structural and form dividers |
| **Primary Accent / Actions** | `bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700` | Primary buttons, active tabs, highlights |
| **Primary Text / Accents** | `text-emerald-400` / `text-emerald-500` | Active labels, key indicators, icons |
| **Warning / Attention** | `text-amber-400`, `bg-amber-500/10`, `border-amber-500/20` | Pending approvals, change requests, conflict warnings |
| **Danger / Conflict / Rejection** | `text-red-400` / `rose-400`, `bg-red-500/10`, `border-red-500/20` | Rejections, pitch conflicts, destructive actions |
| **Neutral / Secondary Actions** | `bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700` | Cancel buttons, secondary actions |

> [!IMPORTANT]
> Never use generic browser blues or indigos (e.g., `blue-500`, `indigo-500`) for standard interactive controls. All action buttons, focus rings, and active states must strictly adhere to the emerald/teal design system.

---

### 1.2 Typography

Configured in `index.css` via Tailwind:
- **Headings & Display**: `font-display` ([Outfit](https://fonts.google.com/specimen/Outfit)). Use for app title, page headers, modal titles, and venue names.
- **Body & UI**: `font-sans` ([Inter](https://fonts.google.com/specimen/Inter)). Use for tables, form inputs, buttons, calendar cells, and body text.
- **Micro Badges**: Custom utility class `.text-xxs` (`font-size: 0.65rem; line-height: 0.85rem;`) for compact status tags and cell badges.

---

### 1.3 Form Controls & Inputs

1. **Standard Inputs & Selects**:
   ```html
   <input
     className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
   />
   ```
2. **Date Pickers**:
   Standardize date inputs with an overlay calendar icon. Make the browser's native picker indicator transparent so clicking anywhere triggers the picker:
   ```html
   <div className="relative flex items-center">
     <input
       type="date"
       className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
     />
     <Calendar size={18} className="absolute right-3.5 text-emerald-500 pointer-events-none" />
   </div>
   ```
3. **Checkboxes**:
   ```html
   <input
     type="checkbox"
     className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
   />
   ```

---

### 1.4 Iconography & Sizing Standards

Use [Lucide React](https://lucide.dev) icons with consistent sizing:
- **18px (`size={18}`)**: Form inputs (calendars, clocks, search inputs, modal close buttons).
- **16px (`size={16}`)**: Inline action buttons (edit, delete, filter toggles, badges).
- **20px (`size={20}`)**: Section titles, navigation icons, modal header banners.
- **12px–14px**: Tiny metadata indicators inside calendar cells and pill badges.

---

### 1.5 Modals & Dialogs

- **Backdrop**: `fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4`
- **Modal Card**: `bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-w-... w-full`
- **Close Button**: Standardize with a Lucide `<X size={18} />` inside a rounded hover pill. Never use raw unicode `✕`:
  ```jsx
  <button
    type="button"
    onClick={onClose}
    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
  >
    <X size={18} />
  </button>
  ```

---

### 1.6 User Feedback (No Browser Alerts)

- **Toast Notifications**: Use the shared `Toast` component from [src/components/shared/Toast.jsx](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/components/shared/Toast.jsx) for non-blocking feedback (success messages, warnings, API error banners).
- **Destructive Confirmations**: Use styled modal dialogs (e.g., `DeleteConfirmModal` or `RejectModal`).
- **Never invoke blocking browser APIs**: Do not use `window.alert()`, `window.confirm()`, or `window.prompt()`.

---

## 2. API Communication Rules

All network communication must route through the centralized API client in [src/services/api.js](file:///c:/Users/timsh/OneDrive/Documents/github/pitchwiz-frontend/src/services/api.js).

1. **No Raw Fetch in Components**:
   - Never call `fetch()` directly inside UI components with manual `Authorization` headers.
   - Never import `import.meta.env.VITE_API_URL` directly across components; `api.js` encapsulates the base URL.
2. **Standard API Wrapper Functions**:
   - Add new endpoint methods directly to `api.js` (e.g., `api.getBookings()`, `api.createBooking()`).
3. **Session Expiry Handling**:
   - `api.js` automatically dispatches the `auth-unauthorized` custom DOM event on 401/403 responses, clearing session tokens and safely redirecting to login.

---

## 3. Component Architecture & Organization

Keep components focused, modular, and decomposed by domain:

```
src/components/
├── calendar/             # CalendarToolbar, BookingCreateModal, BookingEditModal, CellContent, hooks
├── secretary/            # SecretaryDashboard sub-tabs, BookingEditModal, RejectModal, ConfirmApproveModal
├── venues/               # VenueForm, PitchForm, PitchLengthForm, DeleteConfirmModal
├── shared/               # Toast, reusable UI atoms
├── AuthScreens.jsx       # Login and forced password reset
├── ChangePasswordModal.jsx
├── CatererDashboard.jsx
├── FixtureImportManager.jsx
├── PlayCricketSyncManager.jsx
├── PublicBookingForm.jsx
├── TeamsManager.jsx
├── UserManagement.jsx
└── VenuesManager.jsx
```

- **Hooks for State & Conflict Logic**:
  - Complex calendar date navigation and filters belong in `useCalendarState.js`.
  - Pitch conflict and outfield overlap checks belong in `useConflictDetection.js`.

---

## 4. Development & Build Verification

Run verification before committing:

1. **Linting**:
   ```bash
   npm run lint
   ```
2. **Unit Tests (Vitest + MSW)**:
   ```bash
   npm test
   ```
3. **Production Build Check**:
   ```bash
   npm run build
   ```
   (Note: `npm run build` runs `lint`, `test`, and `vite build` to guarantee bundle integrity).
