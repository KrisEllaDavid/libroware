# Libroware — Planned Upgrades & Roadmap

This document tracks all proposed enhancements to the Libroware system, grouped by priority tier. Each item includes a rationale, the affected component(s), and implementation notes.

> **Last reviewed:** 2026-06-15. All Tier 1/2 items from the original roadmap have shipped — see status column in the Tracking Summary.

---

## Tier 1 — High Priority (Next Release)

### U-01 · Email Notifications for Due Dates & Overdue Books — Status: ✅ Done
**Rationale:** Users currently receive no automated reminder when a book is approaching or past its due date. This leads to unnecessary overdue incidents.
**Implemented as:** `backend/src/services/notificationService.js` (nodemailer transport with graceful no-op when `SMTP_HOST` is unset) + `backend/src/services/scheduler.js` (node-cron daily job, default 08:00, configurable via `NOTIFICATION_CRON`), wired into `startServer()` in `src/index.js`.
**Behaviour:**
- 3-day reminder email sent when a borrow's `dueDate` falls exactly 3 days from the cron run date
- Same-day reminder when `dueDate` is today
- Daily overdue notice (with days-overdue count) for all borrows with status `OVERDUE`; also bulk-upgrades any `BORROWED` records that crossed their deadline to `OVERDUE` before sending
- Configurable SMTP via `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — silently disabled if `SMTP_HOST` is unset (safe for dev/offline)
- **Online-only** — server-side cron, no offline queue integration required

---

### U-02 · Fine / Penalty System for Overdue Returns — Status: ✅ Done
**Rationale:** The current system marks borrows as OVERDUE but imposes no financial consequence, reducing accountability.
**Implemented as:** Prisma `Fine` model, `Fine` resolvers (create/waive/pay), admin `FinesManagement.tsx` panel with fine history per user.

---

### U-03 · Book Reservation / Queue System — Status: ✅ Done
**Rationale:** When all copies of a book are borrowed, users have no way to reserve a copy for when it becomes available.
**Implemented as:** Prisma `Reservation` model (PENDING/FULFILLED/CANCELLED), `createReservation`/`cancelReservation` resolvers, "Reserve" button in `UserBookView.tsx`, `UserReservations.tsx` for members to manage their queue position.

---

### U-04 · Frontend Pagination — Status: ✅ Done
**Rationale:** All list queries are currently capped at 50 items with no UI controls. Libraries with large catalogs will silently lose data.
**Implemented as:** `GET_BOOKS`/users queries take `skip`/`take`/search params and return `*Count` totals; `BookManagement.tsx` and `UserManagement.tsx` have page controls.

---

### U-05 · JWT Moved to httpOnly Cookies — Status: ✅ Done
**Rationale:** Storing JWT in `localStorage` exposes tokens to XSS attacks. Any injected script can exfiltrate the token.
**Implemented as:** `cookie-parser` middleware + `res` passed through Apollo context. `login`/`signup` resolvers call `setAuthCookie(res, token)` setting `httpOnly; SameSite=Strict` (add `COOKIE_SECURE=true` to `.env` when HTTPS is configured). Backend token extraction checks cookie first, then `Authorization: Bearer` header. `logout` GraphQL mutation clears the cookie. `AuthContext.tsx`: web login no longer stores the raw token in `localStorage` (only the user JSON); Electron/Capacitor continue using the bearer-token flow via `localStorage` since `SameSite=Strict` blocks cross-scheme cookie delivery from `libroware://` / `capacitor://`. Apollo `clearStore()` fires on logout to purge cached user data.
**CSRF:** `SameSite=Strict` prevents cross-site request forgery without a separate CSRF token — a cross-origin form POST from an attacker's page cannot include the cookie.
**Activation checklist (HTTPS):** Set `COOKIE_SECURE=true` in `.env` and configure TLS (see SERVER_CONFIG.md §7).

---

### U-06 · Profile Update Without Full Page Reload — Status: ✅ Done
**Rationale:** After editing a profile, `window.location.reload()` is called, discarding the Apollo cache and causing a jarring UX.
**Implemented as:** `AuthContext.tsx` exposes `updateUser`, called from `ProfileEditor.tsx` and `UserProfile.tsx` to update state in place without a reload.

---

## Tier 2 — Medium Priority (Version 2.0)

### U-07 · Book QR Code Generation — Status: ✅ Done
**Rationale:** Physical library workflows benefit from QR codes on book covers linking to the digital record.
**Implemented as:** Backend QR generation, `BookQRModal.tsx` and `QRLabelSheet.tsx` printable label sheet view in the admin panel.

---

### U-08 · Advanced Analytics Dashboard — Status: ✅ Done
**Rationale:** The current dashboard provides minimal statistics. Library management requires trend analysis for acquisition decisions.
**Implemented as:** `AnalyticsDashboard.tsx` + `dashboardStats`, `borrowTrends`, `topBorrowedBooks`, `categoryBorrowStats` GraphQL queries.

---

### U-09 · Multi-Language Support (French / English) — Status: Partial (Phase 4)
**Rationale:** The Congo-Cameroon Interstate University operates in both French and English. The current UI is English-only.
**Current state:** `i18next`/`react-i18next` wired up, `frontend/src/locales/{en,fr}.json` in parity (266 lines each), language toggle in nav. Only ~6 of 42 component files use `useTranslation()` so far.
**Remaining:** Extract hardcoded strings from `FinesManagement.tsx`, `UserReservations.tsx`, `AuditLogViewer.tsx`, `DeletedRecords.tsx`, `ISBNLookup.tsx`, `BookQRModal.tsx`/`QRLabelSheet.tsx`, `UserBookView.tsx`, `UserBorrows.tsx`, `BorrowStatistics.tsx`, add matching keys to both locale files.

---

### U-10 · Student ID / University ID Integration — Status: Planned (not yet scheduled)
**Rationale:** Borrowing records should be tied to the university's student ID system to prevent duplicate accounts and ease identity verification.
**Scope:** Prisma schema (`studentId String? @unique` on `User`), import/sync endpoint.
**Details:**
- Optional student ID field on user creation
- Admin bulk-import of students from CSV
- Student ID displayed on borrow slip

---

### U-11 · Soft-Delete Recoverability (Admin Restore) — Status: ✅ Done
**Rationale:** Soft deletes are now implemented but there is no UI to view or recover soft-deleted records.
**Implemented as:** Admin `DeletedRecords.tsx` ("Recycle Bin"), `restoreUser`/`restoreBook`/`hardDeleteUser`/`hardDeleteBook` mutations.

---

## Tier 3 — Low Priority / Future Vision

### U-12 · Mobile Application — Status: Partial (scaffolded)
**Rationale:** Students increasingly rely on mobile devices. A mobile app would increase accessibility and enable features like camera-based ISBN scanning.
**Current state:** Implemented via **Capacitor** (not React Native as originally scoped) — `frontend/capacitor.config.ts` wraps the existing React app for Android/iOS, sharing the GraphQL API and the role-based-views model (members and admins use the same app, differing only by role). GitHub Actions builds a signed Android APK and unsigned iOS IPA.
**Remaining:** Camera barcode/QR scanner for borrow workflow, push notifications for due date reminders (depends on U-01).

---

### U-13 · Interlibrary Loan (ILL) Module — Status: Future
**Rationale:** The university has campuses in two countries. A module allowing cross-campus book requests would increase the utility of the shared catalog.
**Scope:** New `InterlibraryRequest` model, cross-instance API federation.

---

### U-14 · Audit Log Viewer in Admin Panel — Status: ✅ Done
**Rationale:** The `AuditLog` table is populated but currently not exposed in the UI. Admins cannot review who did what.
**Implemented as:** `AuditLogViewer.tsx` + `auditLogs` query with filters by model, action, userId, date range.

---

### U-15 · Book Reading Progress Tracker — Status: Future
**Rationale:** Allow users to log reading progress, enabling the library to surface reading habit insights and encourage engagement.
**Scope:** `ReadingProgress` model, user dashboard widget.

---

## Newly Tracked Items (added 2026-06-15)

### U-16 · Native Desktop Installers (Windows + Ubuntu) — Status: ✅ Done
**Rationale:** Librarians/admins need a installable desktop app rather than relying on a browser tab.
**Implemented as:** Electron thin-client (configurable GraphQL endpoint via `ElectronSettings.tsx`), `desktop:win`/`desktop:linux` build scripts, GitHub Actions `libroware_builds.yml` produces a Windows NSIS installer and Ubuntu `.deb`/`.AppImage` artifacts via `workflow_dispatch`.

---

### U-17 · Offline Mutation Queue — Status: ✅ Done (first slice)
**Rationale:** The app degrades to read-only when offline (cached via `apollo3-cache-persist`), but writes failed outright. Members should be able to borrow/return books offline and have those actions sync automatically when connectivity returns.
**Implemented as:** `frontend/src/offline/` (`offlineQueue.ts`, `cacheUpdates.ts`, `useOfflineMutation.ts`, `useQueuedMutations.ts`, `replayQueue.ts`), wired into `NetworkContext.tsx` (drains queue + shows `pendingCount`/`isSyncing`), `OfflineBanner.tsx`, `UserBookView.tsx` (`CREATE_BORROW`), `UserBorrows.tsx` (`RETURN_BOOK`).
**Remaining:** Extend to `createReservation`/`cancelReservation` (second slice); admin catalog CRUD and file uploads remain online-only by design.

---

### U-18 · Rate Limiter Tuning — Status: ✅ Done
**Rationale:** The original `express-rate-limit` config (100 req/15min per IP globally, 10 attempts/15min for auth) was too aggressive for SPA usage and shared-IP/NAT environments (e.g. campus networks), causing legitimate users to be blocked.
**Implemented as:** `backend/src/index.js` now keys the global limiter on a hash of the auth token (falling back to IP for anonymous requests) at 300 req/min, and the auth limiter on `IP + email` at 20/15min.

---

### U-19 · Book Reviews UI — Status: ✅ Done
**Rationale:** The backend `Review` model and `createReview`/`updateReview`/`deleteReview`/`bookReviews` resolvers existed but had zero frontend usage — dead code with no way for members to rate or review books.
**Implemented as:** New `StarRating.tsx` (display + interactive picker), `BOOK_REVIEWS` query and `CREATE_REVIEW`/`UPDATE_REVIEW`/`DELETE_REVIEW` mutations, and a Reviews section in the `UserBookView.tsx` borrow/read modal showing the average rating, review count, the reviews list, and a form for the signed-in user to post/edit/delete their own review. Online-only (no offline queue integration).

---

## Tracking Summary

| ID   | Title                      | Priority | Status |
|------|----------------------------|----------|--------|
| U-01 | Email notifications        | High | ✅ Done |
| U-02 | Fine / penalty system      | High | ✅ Done |
| U-03 | Book reservation queue     | High | ✅ Done |
| U-04 | Frontend pagination        | High | ✅ Done |
| U-05 | JWT in httpOnly cookies    | High | ✅ Done |
| U-06 | Profile update no reload   | High | ✅ Done |
| U-07 | QR code generation         | Medium | ✅ Done |
| U-08 | Advanced analytics         | Medium | ✅ Done |
| U-09 | Multi-language (FR/EN)     | Medium | ✅ Done |
| U-10 | Student ID integration     | Medium | Planned |
| U-11 | Soft-delete restore UI     | Medium | ✅ Done |
| U-12 | Mobile application         | Low | Partial (Capacitor) |
| U-13 | Interlibrary loan module   | Low | Future |
| U-14 | Audit log viewer           | Low | ✅ Done |
| U-15 | Reading progress tracker   | Low | Future |
| U-16 | Native desktop installers  | High | ✅ Done |
| U-17 | Offline mutation queue     | High | ✅ Done (first slice) |
| U-18 | Rate limiter tuning        | High | ✅ Done |
| U-19 | Book reviews UI            | Medium | ✅ Done |
