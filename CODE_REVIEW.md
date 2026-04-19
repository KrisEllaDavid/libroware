# Libroware Frontend Code Review

## Overview

Full review of the React/TypeScript frontend codebase. All issues below have been addressed and fixed in this session unless marked **Pending**.

---

## Fixed Issues

### Critical

#### 1. Modal confirm executed after close — `Modal.tsx`
**Problem:** `handleConfirm` called `onCancel()` (which closes the modal) *before* `onConfirm()`. This meant mutations fired after the modal was gone, causing race conditions and missed success feedback.  
**Fix:** Reversed order — `onConfirm()` runs first, then `onCancel()` closes the modal. Also removed the `setTimeout` wrapper around `addToast` as it was unnecessary and risked firing after unmount.

#### 2. `as any` cast on ApolloClient — `apollo-client.ts`
**Problem:** `new ApolloClient(clientOptions as any)` bypassed TypeScript type checking on the client configuration, hiding potential config errors.  
**Fix:** Typed `clientOptions` as `ApolloClientOptions<NormalizedCacheObject>` and removed the cast entirely.

#### 3. `@ts-ignore` on networkError — `apollo-client.ts`
**Problem:** Two `@ts-ignore` comments were used to access `networkError.statusCode`, hiding an unsafe property access on a union type.  
**Fix:** Cast to `ServerError` from Apollo's link utils, which properly types the `statusCode` property.

#### 4. Debug console logs in production — `apollo-client.ts`
**Problem:** Every Apollo operation logged request URL, variables, and full response details to the console.  
**Fix:** Removed all debug `console.log` calls. Error logging retained.

---

### High

#### 5. Return book failure silent — `UserBorrows.tsx`
**Problem:** `onError` in the `RETURN_BOOK` mutation only called `console.error`. The user received no feedback when a return failed.  
**Fix:** Added `useToast` and `addToast` call in `onError` with the error message.

#### 6. Per-borrow loading state — `UserBorrows.tsx`
**Problem:** `returningBook` was a single boolean from Apollo's mutation loading state. If multiple books were visible, clicking "Return" on any one disabled ALL return buttons.  
**Fix:** Replaced with `returningBorrowId: string | null` state. Only the specific borrow card being processed shows "Processing..." and is disabled.

#### 7. `setTimeout(500ms)` before refetch on delete — `UserManagement.tsx`
**Problem:** After deleting a user, a 500ms timeout was used before refetching, on the assumption the server needed time to process. This is a fragile race condition — mutations are already awaited by Apollo.  
**Fix:** Removed the timeout. Optimistic UI update happens immediately, then `refetch()` is called directly.

#### 8. Publication year allows future dates — `BookManagement.tsx`
**Problem:** Year validation accepted values up to 9999, allowing books to be created with publication years far in the future.  
**Fix:** Upper bound changed to `new Date().getFullYear()`. Error message updated dynamically to show the current year.

#### 9. Missing toast notifications on book mutation errors — `BookManagement.tsx`
**Problem:** `createBook`, `updateBook`, and `deleteBook` mutations only set a local `error` state on failure, with no toast shown to the user.  
**Fix:** Added `addToast` calls in all three `onError` handlers.

#### 10. Excessive `console.log` in production — `UserManagement.tsx`, `AuthContext.tsx`, `Navigation.tsx`
**Problem:** Debug logs were scattered throughout role checks, user CRUD operations, and navigation handlers, polluting the browser console in production.  
**Fix:** Removed all `console.log` calls. `console.error` retained where appropriate for genuine errors.

#### 11. `catch((error: Error)` incorrect type — `UserManagement.tsx`
**Problem:** Catch block typed the error as `Error`, but TypeScript requires `unknown` for catch variables since TS 4.0+.  
**Fix:** Changed to `catch((error: unknown)`.

---

### Medium

#### 12. `setTimeout` in navigation without cleanup — `Navigation.tsx`
**Problem:** `handleNavigation` wrapped `navigate()` in a 50ms timeout "to ensure menu closes before navigation". This is unnecessary in React 18 (state updates batch automatically) and the timeout had no cleanup on unmount.  
**Fix:** Removed timeout — `closeMenu()` and `navigate()` called synchronously.

#### 13. `setTimeout` in closeButtonHandler — `Navigation.tsx`
**Problem:** A 10ms timeout was used to force menu close state, with a comment implying React state updates are unreliable. This is not the case.  
**Fix:** Simplified to direct `setIsMenuOpen(false)` and class removal.

#### 14. `Math.random()` for toast IDs — `ToastContext.tsx`
**Problem:** `Math.random().toString(36).substring(2, 9)` generates short, collision-prone IDs. With many simultaneous toasts, duplicates are possible.  
**Fix:** Replaced with `crypto.randomUUID()`, which generates RFC 4122 UUIDs — collision-free and available in all modern browsers.

---

### Low

#### 15. Unused `ME_QUERY` — `UserProfile.tsx`
**Problem:** A raw GraphQL string `ME_QUERY` was defined at the top of the file but never used anywhere in the component.  
**Fix:** Removed entirely.

---

## Pending / Further Actions

These issues were identified but require larger refactors or architectural decisions beyond the scope of this session:

### P1 — Pagination (`UserManagement.tsx`, `BookManagement.tsx`)
**Issue:** All list queries use `take: 50` hardcoded. Data beyond 50 items is silently truncated with no UI indication.  
**Recommended fix:** Implement cursor-based or offset pagination. Add "Load more" or page controls. Consider increasing the limit temporarily as a stopgap.

### P2 — `window.location.reload()` after profile update — `UserProfile.tsx`
**Issue:** After editing a profile, `handleProfileUpdate` calls `window.location.reload()`, which discards the Apollo cache and causes a full page refresh.  
**Recommended fix:** Add an `updateUser` function to `AuthContext` that updates the stored user object, then call that from `ProfileEditor`'s `onUpdate` callback. This avoids the reload entirely.

### P3 — JWT stored in `localStorage` — `apollo-client.ts`
**Issue:** Storing JWT tokens in `localStorage` exposes them to XSS attacks. Any injected script can read `localStorage`.  
**Recommended fix:** Move to `httpOnly` cookies for token storage. This requires backend changes (set cookie on login, read from cookie on requests, add CSRF protection).  
**Note:** This is an architectural decision. `localStorage` is acceptable for lower-risk internal apps but should be addressed before public production exposure.

### P4 — `AdminPanel.tsx` dead transition code
**Issue:** `transitionClass` checks `activeTab === "right"` which is never true (activeTab holds tab names like `"users"`, `"books"`, etc.). Both branches of the ternary produce `translate-x-0` / `-translate-x-0` which are equivalent anyway.  
**Recommended fix:** Remove the `transitionClass` variable entirely, or implement proper directional slide animation using tab index comparison.

### P5 — `AuthContext` logout called during render initialization
**Issue:** In the `useEffect` that restores auth state from `localStorage`, the `catch` block calls `logout()` directly. `logout()` calls `setToken`, `setUser`, `setIsAuthenticated` — state setters called inside a `useEffect` are fine, but `logout` is also listed as a dependency concern since it's defined in the same component.  
**Recommended fix:** Extract `logout` logic into a standalone `clearAuthState` helper that only sets state, avoiding the dependency chain issue.

### P6 — No loading state for `BookManagement` delete
**Issue:** When a book is deleted, there is no optimistic UI update — the book stays in the list until `refetch()` completes.  
**Recommended fix:** Apply the same optimistic update pattern used in `UserManagement`: filter the deleted book from local state immediately in `onCompleted`, then confirm with `refetch()`.

---

## Summary

| Category | Total | Fixed | Pending |
|----------|-------|-------|---------|
| Critical | 4 | 4 | 0 |
| High | 7 | 7 | 0 |
| Medium | 3 | 3 | 0 |
| Low | 1 | 1 | 0 |
| Architectural / Further | 6 | 0 | 6 |
| **Total** | **21** | **15** | **6** |
