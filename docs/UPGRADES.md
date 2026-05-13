# Libroware — Planned Upgrades & Roadmap

This document tracks all proposed enhancements to the Libroware system, grouped by priority tier. Each item includes a rationale, the affected component(s), and implementation notes.

---

## Tier 1 — High Priority (Next Release)

### U-01 · Email Notifications for Due Dates & Overdue Books
**Rationale:** Users currently receive no automated reminder when a book is approaching or past its due date. This leads to unnecessary overdue incidents.
**Scope:** Backend (new `NotificationService`), cron job via `node-cron`, SMTP integration (e.g. Nodemailer + SendGrid/Brevo).
**Details:**
- 3-day reminder email before due date
- Same-day reminder on due date
- Daily overdue notice until book is returned
- Configurable SMTP credentials via `.env`

---

### U-02 · Fine / Penalty System for Overdue Returns
**Rationale:** The current system marks borrows as OVERDUE but imposes no financial consequence, reducing accountability.
**Scope:** Prisma schema (`Fine` model), backend resolver, admin UI panel.
**Details:**
- Configurable daily fine rate (e.g. 100 FCFA/day) set by admin
- Fine automatically computed on `returnBook` mutation
- Admin can waive fines
- Fine history visible to user and librarian

---

### U-03 · Book Reservation / Queue System
**Rationale:** When all copies of a book are borrowed, users have no way to reserve a copy for when it becomes available.
**Scope:** Prisma schema (`Reservation` model with status PENDING/FULFILLED/CANCELLED), backend, frontend reservation button on book detail page.
**Details:**
- FIFO queue per book
- Automatic notification when reservation is fulfilled
- Reservation expires after 48 hours if not collected

---

### U-04 · Frontend Pagination
**Rationale:** All list queries are currently capped at 50 items with no UI controls. Libraries with large catalogs will silently lose data.
**Scope:** Frontend (`BookManagement.tsx`, `UserManagement.tsx`, `UserBorrows.tsx`).
**Details:**
- Offset-based pagination with page controls
- Configurable page size (10, 25, 50)
- URL-synced page state for deep-linking

---

### U-05 · JWT Moved to httpOnly Cookies
**Rationale:** Storing JWT in `localStorage` exposes tokens to XSS attacks. Any injected script can exfiltrate the token.
**Scope:** Backend (set cookie on login), Frontend (remove localStorage token), CSRF token header.
**Details:**
- `httpOnly; Secure; SameSite=Strict` cookie
- Backend `/logout` endpoint clears the cookie
- CSRF double-submit cookie pattern
- Requires HTTPS in production

---

### U-06 · Profile Update Without Full Page Reload
**Rationale:** After editing a profile, `window.location.reload()` is called, discarding the Apollo cache and causing a jarring UX.
**Scope:** `AuthContext.tsx`, `UserProfile.tsx`.
**Details:**
- Add `updateUser` function to `AuthContext`
- Call it from `ProfileEditor` `onUpdate` callback
- Update Apollo cache directly via `cache.writeQuery`

---

## Tier 2 — Medium Priority (Version 2.0)

### U-07 · Book QR Code Generation
**Rationale:** Physical library workflows benefit from QR codes on book covers linking to the digital record.
**Scope:** Backend (QR generation with `qrcode` library), Admin print view.
**Details:**
- QR encodes the book's public URL or ISBN
- Printable label sheet view in admin panel
- Optional barcode (EAN-13 from ISBN)

---

### U-08 · Advanced Analytics Dashboard
**Rationale:** The current dashboard provides minimal statistics. Library management requires trend analysis for acquisition decisions.
**Scope:** Frontend (new Analytics tab), Backend (aggregation queries).
**Details:**
- Most borrowed books (monthly/yearly)
- Peak borrowing hours/days
- Overdue rate by category
- New member registrations over time
- Export to CSV/PDF

---

### U-09 · Multi-Language Support (French / English)
**Rationale:** The Congo-Cameroon Interstate University operates in both French and English. The current UI is English-only.
**Scope:** Frontend — `i18next` is already installed; translation JSON files needed.
**Details:**
- Language toggle in navigation bar
- All UI strings externalised to translation files
- `fr.json` and `en.json` initial locales
- Language preference stored in user profile

---

### U-10 · Student ID / University ID Integration
**Rationale:** Borrowing records should be tied to the university's student ID system to prevent duplicate accounts and ease identity verification.
**Scope:** Prisma schema (`studentId String? @unique` on `User`), import/sync endpoint.
**Details:**
- Optional student ID field on user creation
- Admin bulk-import of students from CSV
- Student ID displayed on borrow slip

---

### U-11 · Soft-Delete Recoverability (Admin Restore)
**Rationale:** Soft deletes are now implemented but there is no UI to view or recover soft-deleted records.
**Scope:** Admin panel (new "Deleted Records" section), GraphQL `restoreUser` / `restoreBook` mutations.
**Details:**
- Admin-only view of soft-deleted users and books
- Restore button re-sets `deletedAt = null`
- Permanent delete option (hard delete) with confirmation

---

## Tier 3 — Low Priority / Future Vision

### U-12 · Mobile Application (React Native)
**Rationale:** Students increasingly rely on mobile devices. A mobile app would increase accessibility and enable features like camera-based ISBN scanning.
**Scope:** New `mobile/` package sharing the existing GraphQL API.
**Details:**
- iOS and Android via React Native / Expo
- Camera barcode/QR scanner for borrow workflow
- Push notifications for due date reminders

---

### U-13 · Interlibrary Loan (ILL) Module
**Rationale:** The university has campuses in two countries. A module allowing cross-campus book requests would increase the utility of the shared catalog.
**Scope:** New `InterlibraryRequest` model, cross-instance API federation.

---

### U-14 · Audit Log Viewer in Admin Panel
**Rationale:** The `AuditLog` table is populated but currently not exposed in the UI. Admins cannot review who did what.
**Scope:** Admin panel (new Audit tab), GraphQL `auditLogs` query with filters.
**Details:**
- Filter by model, action, userId, date range
- Export to CSV for compliance reporting

---

### U-15 · Book Reading Progress Tracker
**Rationale:** Allow users to log reading progress, enabling the library to surface reading habit insights and encourage engagement.
**Scope:** `ReadingProgress` model, user dashboard widget.

---

## Tracking Summary

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| U-01 | Email notifications | High | Planned |
| U-02 | Fine / penalty system | High | Planned |
| U-03 | Book reservation queue | High | Planned |
| U-04 | Frontend pagination | High | Planned |
| U-05 | JWT in httpOnly cookies | High | Planned |
| U-06 | Profile update no reload | High | Planned |
| U-07 | QR code generation | Medium | Planned |
| U-08 | Advanced analytics | Medium | Planned |
| U-09 | Multi-language (FR/EN) | Medium | Planned |
| U-10 | Student ID integration | Medium | Planned |
| U-11 | Soft-delete restore UI | Medium | Planned |
| U-12 | Mobile application | Low | Future |
| U-13 | Interlibrary loan module | Low | Future |
| U-14 | Audit log viewer | Low | Planned |
| U-15 | Reading progress tracker | Low | Future |
