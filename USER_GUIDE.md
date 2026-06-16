# Libroware — User Guide

> **Libroware** is a library management system with three user roles: **Member**, **Librarian**, and **Admin**. This guide explains every feature and action available to each role.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Navigation & Interface](#2-navigation--interface)
3. [Member Features](#3-member-features)
   - 3.1 [Dashboard Overview](#31-dashboard-overview)
   - 3.2 [Browse Books](#32-browse-books)
   - 3.3 [Scan a Book Barcode](#33-scan-a-book-barcode)
   - 3.4 [Borrowing a Book](#34-borrowing-a-book)
   - 3.5 [Reading a Book (In-Library)](#35-reading-a-book-in-library)
   - 3.6 [My Books](#36-my-books)
   - 3.7 [Cancelling a Pending Request](#37-cancelling-a-pending-request)
   - 3.8 [Returning a Book](#38-returning-a-book)
   - 3.9 [Reservations](#39-reservations)
   - 3.10 [My Fines](#310-my-fines)
   - 3.11 [Writing a Review](#311-writing-a-review)
4. [Librarian Features](#4-librarian-features)
   - 4.1 [Approving Borrow Requests](#41-approving-borrow-requests)
   - 4.2 [Rejecting Borrow Requests](#42-rejecting-borrow-requests)
   - 4.3 [Active Borrows & Returns](#43-active-borrows--returns)
   - 4.4 [Extending a Due Date](#44-extending-a-due-date)
   - 4.5 [Manual Front-Desk Checkout](#45-manual-front-desk-checkout)
   - 4.6 [Borrow History](#46-borrow-history)
   - 4.7 [Managing Books](#47-managing-books)
   - 4.8 [ISBN Lookup & Barcode Scan](#48-isbn-lookup--barcode-scan)
   - 4.9 [QR Code Labels](#49-qr-code-labels)
   - 4.10 [Managing Authors](#410-managing-authors)
   - 4.11 [Managing Categories](#411-managing-categories)
   - 4.12 [Managing Users](#412-managing-users)
   - 4.13 [Fines Management](#413-fines-management)
5. [Admin-Only Features](#5-admin-only-features)
   - 5.1 [Recycle Bin (Deleted Records)](#51-recycle-bin-deleted-records)
   - 5.2 [Audit Log](#52-audit-log)
6. [Notifications](#6-notifications)
7. [Your Profile](#7-your-profile)
8. [Settings & Preferences](#8-settings--preferences)
9. [Offline Mode](#9-offline-mode)
10. [Status Reference](#10-status-reference)
11. [Role Permissions Matrix](#11-role-permissions-matrix)

---

## 1. Getting Started

### Logging In

Open Libroware and enter your **email address** and **password** on the login screen, then click **Sign In**.

If this is the first time you log in and an admin created your account, you will be prompted to **set your own password** before continuing. Enter a new password (minimum 8 characters), confirm it, and click **Set Password**.

### Roles

| Role | Who it's for |
|---|---|
| **Member** | Library patrons — borrow, reserve, and review books |
| **Librarian** | Library staff — manage books, approve requests, handle checkouts and fines |
| **Admin** | Full system access — everything a Librarian can do, plus user management, audit logs, and permanent deletion |

After logging in, you are automatically directed to your home page:
- **Members** → User Dashboard (`/dashboard`)
- **Librarians** → Library Management (`/admin`)
- **Admins** → Library Management, Users tab (`/admin?tab=users`)

---

## 2. Navigation & Interface

### Top Navigation Bar

The navigation bar is always visible at the top of the screen.

| Element | Description |
|---|---|
| **Libroware logo** | Click to return to your home page |
| **Theme toggle** | Switch between light and dark mode |
| **Notification bell** | Shows your unread notification count; click to open your notifications page |
| **Profile avatar** | Click to open the profile dropdown menu |

### Profile Dropdown Menu

| Link | What it does |
|---|---|
| **Your Profile** | View and edit your profile |
| **Library Management / Dashboard** | Your role's home page |
| **Notifications** | Full notifications page |
| **About Libroware** | App information and version |
| **Language toggle** | Switch between English and French |
| **Sign out** | Log out of the application |

### Mobile Menu

On small screens, the navigation bar collapses into a hamburger menu (☰). Tap it to slide down all navigation links. Close it by tapping the × button, pressing Escape, or tapping outside the menu.

### Dark Mode

Click the **sun/moon icon** in the nav bar to toggle between light and dark mode. Your preference is saved and persists between sessions.

### Language

Click **Français / English** in the profile menu to switch the interface language. Currently supported: **English** and **French**.

---

## 3. Member Features

### 3.1 Dashboard Overview

After logging in, Members land on the **Dashboard** (`/dashboard`). The dashboard has six tabs across the top:

| Tab | Content |
|---|---|
| **Dashboard** | Summary stats and borrowing statistics chart |
| **My Books** | All your borrows — active, pending, returned |
| **My Requests** | Borrow request history |
| **Reservations** | Books you have reserved |
| **My Fines** | Your fines — outstanding and settled |
| **Browse Books** | Search the catalog and request books |

The **Dashboard** tab shows four key figures at a glance:

- **Total Borrows** — lifetime count of all borrow requests you've made
- **Overdue** — borrows that have passed their due date and not been returned
- **Returned Books** — books you have successfully returned
- **Outstanding Fines** — total amount owed in FCFA (shown in red if greater than zero)

Below the stats, a **Borrowing Statistics** chart shows your borrow and return activity broken down by month and by book category.

---

### 3.2 Browse Books

Go to the **Browse Books** tab to explore the library catalog.

**Searching and filtering:**

- Type in the **Search** box to filter by title or author name in real-time.
- Use the **Category** dropdown to filter by a specific category.
- All filters combine — you can search within a category.

**Book cards** show:
- Cover image (or a placeholder if none exists)
- Title and authors
- Category tags
- Brief description
- **Availability** — how many copies are currently available out of the total

**Action buttons** on each card:

| Button | Condition | What happens |
|---|---|---|
| **Borrow** (green) | At least 1 copy available | Opens borrow request modal |
| **Read** (blue) | At least 1 copy available | Opens a same-day read request modal |
| **Reserve** (amber) | All copies are borrowed | Creates a reservation — you'll be notified when a copy becomes available |

---

### 3.3 Scan a Book Barcode

On the Browse Books page, click the **Scan Book** button (next to the search bar) to open the scan panel.

**Two ways to look up a book by ISBN:**

1. **Manual entry** — Type the ISBN directly into the input field and click **Lookup** (or press Enter).
2. **Camera scan** — Click the camera icon to activate your device camera. Point it at the barcode on the back of a book. Supported formats: EAN-13, EAN-8, ISBN, Code 128, UPC-A.

When a book is found, the scan panel closes and the borrow modal opens automatically. If the book is not in the library's catalog, an error message appears: *"This book is not in our catalog."*

Click the **×** button on the scan panel, or click **Scan Book** again to close the panel without scanning.

---

### 3.4 Borrowing a Book

Click **Borrow** on any available book card. A modal opens with the book's details.

**Notice:** An amber banner at the top of the modal reminds you that borrow requests require approval from a librarian before they are confirmed.

**Fill in the form:**

| Field | Required | Notes |
|---|---|---|
| **Note** | No | Optional message to the librarian (e.g. reason, urgency) |
| **Return by** | Yes | Choose a return date between tomorrow and 14 days from today. Defaults to 7 days. |

Click **Borrow**. A toast notification confirms: *"Request submitted — awaiting approval from a librarian."*

Your request appears in **My Books** with status **Pending Approval** (amber badge). You will receive a notification once a librarian approves or rejects it.

---

### 3.5 Reading a Book (In-Library)

Click **Read** on any available book card. The modal is the same as the borrow modal, but without a date picker — a read session is always due back the same day (by 23:59).

The request also goes into **Pending Approval** and requires a librarian to approve it.

---

### 3.6 My Books

The **My Books** tab shows all your borrow and read requests.

**Search and filter:**

- Type in the search box to find a specific book by title, ISBN, or author.
- Use the filter buttons to show **All**, **Active** (not returned), or **Returned** books.

**Each card shows:**
- Book cover, title, authors
- Date borrowed, due date, and returned date (if applicable)
- Current status

**Status badges:**

| Badge | Colour | Meaning |
|---|---|---|
| **Pending Approval** | Amber | Your request is waiting for a librarian to review it |
| **Borrowed / Active** | Teal | Approved and checked out — return by the due date |
| **Overdue** | Red | The return date has passed |
| **Returned** | Green | Returned successfully |

---

### 3.7 Cancelling a Pending Request

If your request has not yet been approved, you can cancel it.

On any card with status **Pending Approval**, click the **Cancel Request** button (amber). The request is immediately cancelled and the book's availability is restored. You will be redirected back to the active borrows list.

Once a request has been **approved**, you can no longer cancel — contact library staff.

---

### 3.8 Returning a Book

On any active borrow card in **My Books**, click **Return Book** (green button).

The book is immediately marked as returned, and the available copy count increases. If you are offline, the return request is queued locally and will sync automatically when your connection is restored. While queued, the button shows *"Returning... (will sync)"*.

---

### 3.9 Reservations

Go to the **Reservations** tab to see all your reservations.

**Reservation statuses:**

| Status | Colour | Meaning |
|---|---|---|
| **Pending** | Amber | Waiting for a copy to become available |
| **Fulfilled** | Green | A copy is ready — collect it before the expiry date shown |
| **Expired** | Red | The pickup window passed without collection |
| **Cancelled** | Grey | You cancelled this reservation |

When a reservation is **Fulfilled**, a message shows the deadline: *"A copy is ready — collect before [date]."*

If a pending reservation is expiring within 6 hours, a warning shows the exact expiry time.

**Cancelling a reservation:** Click the **Cancel** button on any reservation with status **Pending**. Fulfilled, Expired, and Cancelled reservations cannot be cancelled again.

---

### 3.10 My Fines

Go to the **My Fines** tab to see your fine history.

**The table shows:**
- Book title
- Days overdue
- Fine amount in FCFA
- Status: **Pending** (red), **Paid** (green), or **Waived** (grey)
- Date the fine was issued

If you have outstanding fines, the total is shown in red at the top of the page. Fines are settled **in person with library staff** — you cannot pay online.

---

### 3.11 Writing a Review

When you open any book's borrow or read modal, a **Reviews** section appears at the bottom of the modal.

**To leave a review:**
1. Click a star (1–5) to set your rating.
2. Optionally write a comment (up to 2000 characters) in the text box.
3. Click **Post Review**.

**To update your review:** Change the star rating or comment, then click **Update Review**.

**To delete your review:** Click the red **Delete** button next to your existing review.

All reviews from all members are visible in the reviews section, showing the reviewer's name, star rating, comment, and date posted.

---

## 4. Librarian Features

Librarians access the Library Management panel at `/admin`. The panel has a tab bar at the top — click any tab to switch sections.

### 4.1 Approving Borrow Requests

Go to the **Pending** tab. If there are any requests awaiting approval, an **Awaiting Approval** section appears at the top with an amber badge showing the count.

**Each request card shows:**
- Book cover thumbnail
- Book title and author(s)
- Member's name and email
- Requested date and proposed due date
- Member's note (if they added one)

**To approve a request:** Click the green **Approve** button. The borrow status changes to **Borrowed**, the member receives an approval notification, and the card disappears from the queue.

---

### 4.2 Rejecting Borrow Requests

**To reject a request:** Click the red **Reject** button on the request card. A confirmation modal opens.

**In the modal:**
- A summary of the book and member is shown.
- You can optionally type a **reason** for rejection (e.g. *"Account has outstanding fines"*, *"Copy reserved for another patron"*). The reason will be included in the notification sent to the member.

Click **Reject Request** to confirm. The request is deleted, the book availability is restored, and the member receives a rejection notification.

---

### 4.3 Active Borrows & Returns

Below the approval queue, the **Active Borrows** table lists all currently checked-out books.

**Search and sort:**
- Use the search box to filter by book title, member name, or email.
- Overdue borrows are sorted to the top automatically.

**Each row shows:**
- Book title, ISBN, and author(s)
- Member name and email
- Date borrowed
- Due date (shown in red with days overdue if past due)
- Status badge: **Borrowed** (amber) or **Overdue** (red)

**Actions:**

| Button | What it does |
|---|---|
| **Return** | Marks the borrow as returned immediately. The available copy count increases. |
| **Extend** | Opens the extend modal to grant extra days. |

---

### 4.4 Extending a Due Date

Click **Extend** on any active borrow row.

In the modal, choose how many extra days to grant:

| Option | Notes |
|---|---|
| **+3 days** | Adds 3 days from today (if overdue) or from the existing due date |
| **+7 days** | Adds 7 days |
| **+14 days** | Adds 14 days |

The new due date is previewed below the options before you confirm. Click **Extend** to save.

---

### 4.5 Manual Front-Desk Checkout

To create a borrow directly (bypassing the member approval flow), click **Check Out Book** in the Pending tab header.

A modal opens with three steps:

**Step 1 — Select a member:**
Type at least 2 characters of the member's name or email. A dropdown list of matching members appears. Click the correct member. The selected member's card shows their name, email, and any overdue borrows or outstanding fines as a warning.

To choose a different member, click **Change**.

**Step 2 — Select a book:**
Type at least 2 characters of the book title. A dropdown appears showing matching books with their available copy counts. Books with 0 available copies are greyed out and cannot be selected.

**Step 3 — Set the loan period:**
Choose the number of checkout days: **7**, **14**, **21**, or **30** (default: 14).

Click **Check Out** to create the borrow. The borrow is created with status **Borrowed** immediately — no approval step is required for staff-created checkouts.

---

### 4.6 Borrow History

Go to the **History** tab for a full archive of all borrows in the system.

**Filter tabs:** All / Active (not returned) / Returned

**Search:** Filter by book title, member name, or email.

**Table columns:**
- Book (title + ISBN + author)
- Member (name + email)
- Borrowed date
- Due date (red if overdue)
- Returned date (if applicable)
- Status badge

The list is paginated — 25 rows per page. Use the **Previous** and **Next** buttons to navigate.

---

### 4.7 Managing Books

Go to the **Books** tab to manage the library catalog.

**Overview table:**
- Columns: Title, ISBN, Authors, Categories, Total Quantity, Available Copies
- Use the **search box** to filter by title in real time.
- Paginated — 25 books per page.

**Actions per book:**

| Icon | Action |
|---|---|
| QR icon | Show or print this book's QR code |
| Pencil | Edit book details |
| Trash | Delete the book (soft delete — goes to Recycle Bin) |

#### Adding a New Book

Click **Add Book**. A form modal opens.

| Field | Required | Notes |
|---|---|---|
| **Title** | Yes | |
| **ISBN** | Yes | Must be 10 or 13 digits. Checked for uniqueness when you leave the field. |
| **Description** | No | |
| **Publication Year** | Yes | A 4-digit year between 1000 and the current year |
| **Page Count** | Yes | Must be at least 1 |
| **Quantity** | Yes | Total number of physical copies in the library |
| **Authors** | No | Select from existing authors; or type a new name and click **+** to add inline |
| **Categories** | No | Select from existing categories; or type and click **+** to add inline |
| **Cover Image** | No | Can be auto-filled via ISBN lookup, or uploaded after saving |

New authors and categories typed inline are created automatically when you click **Save**.

#### Editing a Book

Click the **pencil icon** on any book row. The same form opens, pre-filled with the existing data. Edit any field and click **Save**. To upload or change the cover image in edit mode, use the **Cover Image** upload area.

#### Deleting a Book

Click the **trash icon**. A confirmation modal appears. Click **Delete** to confirm. The book is soft-deleted and moves to the **Recycle Bin** — it can be restored from there if needed.

---

### 4.8 ISBN Lookup & Barcode Scan

When adding a new book, click **Auto-fill from ISBN / Barcode** to look up book data automatically.

**Two methods:**

1. **Manual ISBN** — Type the ISBN (10 or 13 digits) into the input field and click **Lookup**.
2. **Camera scan** — Click the camera icon to activate your camera and scan a barcode from a physical book.

Libroware fetches data from the Open Library database and auto-fills:
- Title
- Description
- Publication year
- Page count
- Cover image
- Authors (matched or queued for creation)
- Categories (matched or queued for creation)

A notice shows which authors and categories will be created on save. If you cancel the form, no authors or categories are created.

After auto-fill, review the data — you can edit any field before saving.

---

### 4.9 QR Code Labels

Click the QR icon next to any book to see its individual QR code (encodes the ISBN). You can download or print it.

To print labels for all books at once, click **Print QR Labels** at the top of the Books tab. A print-ready sheet opens with QR codes and titles in a 4-column grid. Click **Print All** to send it to your printer.

---

### 4.10 Managing Authors

Go to the **Authors** tab.

- **Add Author** — Click the button, enter the author's name, and save.
- **Edit** — Click the pencil icon on any row to rename the author.
- **Delete** — Click the trash icon to soft-delete. The author moves to the Recycle Bin.

---

### 4.11 Managing Categories

Go to the **Categories** tab.

- **Add Category** — Click the button, enter a name and optional description, and save.
- **Edit** — Click the pencil icon to update a category.
- **Delete** — Click the trash icon to soft-delete.

---

### 4.12 Managing Users

Go to the **Users** tab.

**Overview table:**
- Columns: Name, Email, Role (colour badge), Actions
- Search by name or email in real time.
- Paginated — 25 users per page.

#### Adding a New User

Click **Add User**. Fill in the form:

| Field | Required | Notes |
|---|---|---|
| **First Name** | Yes | |
| **Last Name** | Yes | |
| **Email** | Yes | Must be unique |
| **Password** | Yes | The initial password — the user will be prompted to change it on first login |
| **Role** | Yes | ADMIN, LIBRARIAN, or USER (Member) |
| **Profile picture** | No | Upload an image |

**Requires password change** is enabled by default — the user must set their own password on first login.

#### Editing a User

Click the **pencil icon**. The same form opens pre-filled. Leave the password field blank to keep the existing password. Click **Save**.

#### Deleting a User

Click the **trash icon**. A confirmation modal appears. Confirm to soft-delete the user. The account moves to the **Recycle Bin** and the user can no longer log in. Admins can restore it from the Recycle Bin.

---

### 4.13 Fines Management

Go to the **Fines** tab to manage member fines.

**Header area:**
- Shows the **total outstanding fines** across all members in FCFA.
- Shows the **current daily fine rate** (FCFA per day per overdue borrow).

**Setting the fine rate:**

Click **Set Daily Rate**, enter a new amount in FCFA, and click **Apply**. The rate applies to all future fine calculations.

**Filter tabs:** All / Pending / Waived

**Fine table columns:**
- Member name and email
- Book title
- Days overdue (in red)
- Fine amount (FCFA)
- Status: **Pending**, **Paid**, or **Waived**
- Actions (available on Pending fines only)

**Actions:**

| Button | What it does |
|---|---|
| **Waive** | Forgives the fine entirely. Status becomes Waived. |
| **Mark Paid** | Records that payment was collected in person. Status becomes Paid. |

Fines are auto-generated by the system when a borrow becomes overdue.

---

## 5. Admin-Only Features

Admins have access to two additional tabs not visible to Librarians.

### 5.1 Recycle Bin (Deleted Records)

Go to the **Recycle Bin** tab.

The Recycle Bin has two sub-tabs: **Users** and **Books**.

**Deleted Users table:**

| Column | Description |
|---|---|
| Name + Email | Who was deleted |
| Role | ADMIN (red), LIBRARIAN (amber), or USER (grey) badge |
| Deleted on | When it was deleted |

**Actions:**

| Button | What it does |
|---|---|
| **Restore** | Restores the user's account — they can log in again |
| **Delete Permanently** | Opens a confirmation modal; this action cannot be undone |

**Deleted Books table:**

Same pattern: book title, ISBN, authors, deletion date. Same restore/delete permanently actions.

**Permanent deletion confirmation:** The modal explicitly states the action is irreversible and requires a deliberate click on **Delete Permanently**.

---

### 5.2 Audit Log

Go to the **Audit Log** tab for a complete record of all data changes in the system.

Every CREATE, UPDATE, and DELETE action on Users, Books, Borrows, Authors, Categories, Fines, Reservations, and Reviews is recorded.

**Filter row:**

| Filter | Options |
|---|---|
| **Model** | All / User / Book / Borrow / Author / Category / Fine / Reservation / Review |
| **Action** | All / CREATE / UPDATE / DELETE |
| **Actor** | Type a user ID or email to filter by who made the change |

Click **Clear Filters** to reset all filters.

**Table columns:**

| Column | Description |
|---|---|
| **Timestamp** | Date and time of the action |
| **Action** | CREATE (green), UPDATE (blue), DELETE (red) |
| **Model** | Which data type was changed |
| **Record ID** | The ID of the affected record (truncated) |
| **Actor** | The user who made the change — name, email, or "System" / "Deleted user" if no longer in the system |

Paginated — 30 entries per page.

---

## 6. Notifications

### Notification Bell

The bell icon in the top navigation bar shows a red badge with the count of unread notifications. The count refreshes automatically every 30 seconds. Click the bell to go to your Notifications page.

### Notifications Page (`/notifications`)

All notifications are listed here in reverse chronological order.

**Filter tabs:** **All** / **Unread**

**Mark all as read:** Click the link at the top right to mark every notification as read at once.

**Clicking a notification** marks it as read and navigates you to the relevant page (e.g. clicking a borrow approval notification takes you to your My Books tab).

**Notification types:**

| Type | Colour | When it appears |
|---|---|---|
| **New Borrow Request** | Blue | Staff receive this when a member submits a borrow request |
| **Request Approved** | Green | Member receives this when their request is approved |
| **Request Rejected** | Red | Member receives this when their request is rejected (reason included if provided) |
| **Overdue Reminder** | Orange | Member receives this when a borrow becomes overdue (sent once per borrow per 24 hours) |
| **Reservation Ready** | Purple | Member receives this when a reserved book becomes available for pickup |
| **Fine Issued** | Amber | Member receives this when a fine is applied to their account |

**Unread notifications** have a green dot in the top-right corner and a tinted emerald background. Read notifications have a white/dark background.

---

## 7. Your Profile

Click **Your Profile** in the profile dropdown to open your profile page.

**Information displayed:**
- Profile picture (or initials avatar)
- Full name
- Email address
- Role badge
- Member Since date
- Account status
- Last account update date

**Editing your profile:**

Click **Edit Profile**. A form opens with:
- First name
- Last name
- Email
- Password (leave blank to keep current password)
- Profile picture upload (click or drag-and-drop an image)

Click **Save Changes** when done. Your name and avatar update immediately across the app.

**Viewing another member's profile (Librarians and Admins):**

Staff can view any member's profile by navigating to `/profile/[userId]`. The same information is displayed, but the edit button is only shown for your own profile.

---

## 8. Settings & Preferences

### Theme

Click the **sun/moon icon** in the navigation bar to switch between light and dark mode. The choice is saved automatically.

### Language

Open the profile dropdown and click **Français** (to switch to French) or **English** (to switch to English). The language applies immediately across the entire interface and is stored locally.

---

## 9. Offline Mode

Libroware supports limited offline usage. When your internet connection is unavailable:

- A **banner** appears at the top of the screen indicating you are offline.
- **Borrow requests** you submit are saved locally and sent to the server automatically when you reconnect.
- **Return requests** are also queued — the button will show *"Returning... (will sync)"* while queued.
- While offline, the book's availability count updates immediately on your screen (optimistic update) — it will be confirmed by the server once reconnected.

Actions that **cannot** be performed offline: approving/rejecting requests, managing users and books, viewing fines and audit logs.

---

## 10. Status Reference

### Borrow Statuses

| Status | Meaning |
|---|---|
| **Pending Approval** | The member submitted a request; a librarian has not yet reviewed it |
| **Borrowed** | Approved and currently checked out |
| **Overdue** | The return deadline has passed; the book has not been returned |
| **Returned** | The book has been returned to the library |

### Reservation Statuses

| Status | Meaning |
|---|---|
| **Pending** | Waiting for an available copy |
| **Fulfilled** | A copy is ready — the member must collect it before the deadline |
| **Expired** | The pickup deadline passed without collection |
| **Cancelled** | The member cancelled the reservation |

### Fine Statuses

| Status | Meaning |
|---|---|
| **Pending** | Fine is outstanding — not yet paid or waived |
| **Paid** | Payment was collected in person by library staff |
| **Waived** | Fine was forgiven by a librarian or admin |

---

## 11. Role Permissions Matrix

| Feature | Member | Librarian | Admin |
|---|:---:|:---:|:---:|
| Log in and view profile | ✓ | ✓ | ✓ |
| Edit own profile & password | ✓ | ✓ | ✓ |
| Browse books & search catalog | ✓ | ✓ | ✓ |
| Scan barcode to find a book | ✓ | ✓ | ✓ |
| Submit borrow / read request | ✓ | ✓ | ✓ |
| Cancel own pending request | ✓ | ✓ | ✓ |
| Return a borrowed book | ✓ | ✓ | ✓ |
| Reserve an unavailable book | ✓ | ✓ | ✓ |
| Cancel own reservation | ✓ | ✓ | ✓ |
| Write, edit, delete own review | ✓ | ✓ | ✓ |
| View own fines | ✓ | ✓ | ✓ |
| Receive in-app notifications | ✓ | ✓ | ✓ |
| Approve / reject borrow requests | — | ✓ | ✓ |
| Create manual front-desk checkout | — | ✓ | ✓ |
| Return any member's book | — | ✓ | ✓ |
| Extend any borrow's due date | — | ✓ | ✓ |
| View full borrow history | — | ✓ | ✓ |
| Add / edit / delete books | — | ✓ | ✓ |
| ISBN lookup and barcode scan (admin) | — | ✓ | ✓ |
| Print QR code labels | — | ✓ | ✓ |
| Add / edit / delete authors | — | ✓ | ✓ |
| Add / edit / delete categories | — | ✓ | ✓ |
| Add / edit / delete users | — | ✓ | ✓ |
| View all members' profiles | — | ✓ | ✓ |
| Waive or mark fines as paid | — | ✓ | ✓ |
| Set the daily fine rate | — | ✓ | ✓ |
| Restore soft-deleted records | — | — | ✓ |
| Permanently delete records | — | — | ✓ |
| View the audit log | — | — | ✓ |
