---
name: manabandhu-expenses
description: Maintain ManaBandhu shared expense groups, entries, balances, settlements, currency precision, participant permissions, and financial history. Use for any change under the expenses module or its contracts.
---

# Expenses

## Module Purpose and Ownership

Owns expense groups, entries, balances, settlements, currency precision, participant permissions, history, and audit-friendly calculations.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/expenses` | `ExpensesScreen` (`screenId="home"`) | catalog | loading, empty, error |
| `/expenses/groups` | `ExpenseGroupsScreen` | list | loading, empty, error |
| `/expenses/groups/[groupId]` | `GroupDetailsScreen` | detail | loading, error, empty |
| `/expenses/add` | `AddExpenseScreen` | form | normal, error, success, loading |
| `/expenses/balances` | `BalancesScreen` | list | loading, empty, error |
| `/expenses/settlements` | `SettlementsScreen` | list | loading, empty, error |

## Component Inventory

- `ExpensesScreen` (`/expenses`) - `Screen` + `ScreenHeader` (one primary action: Add expense), per-currency balance card, `SegmentedControl` tabs with counts (Groups / Balances / Activity); settle-up lives on `/expenses/balances` only
- `ExpenseGroupsScreen` - create-group card (`TextField`, radio `Chip`s) and group `Card` list
- `GroupDetailsScreen` - expenses (`categoryLabel`, local `expenseDate`), members (`PersonRow`, owner badge, owner Remove / member Leave with destructive `useConfirm`), owner "Add member" `BottomSheet` (pick from chat contacts via `useChatContacts` from `@/modules/chat`, or paste a member UUID), empty state action "Add expense"
- `AddExpenseScreen` - `Screen maxWidth="form" keyboardAvoiding` + `ActionBar`; group/category radio chips (category by id from `EXPENSE_CATEGORIES`), strict amount (`parseAmount`), equal split only (no split picker); success = `showMessage` + `router.back()`
- `BalancesScreen` - per-currency owed/owe cards and net lines; "Record payment" / "Mark received" with `useConfirm` before `recordSettlement`
- `SettlementsScreen` - `StatusBadge` (case-insensitive `settlementStatus`), "Confirm received" (confirm) and "Cancel payment" (destructive confirm)
- Pure helpers: `expenses/utils/expenseMath.ts` (`parseAmount`, `EXPENSE_CATEGORIES`, `categoryLabel`, `sumByCurrency`, `netByCurrency`, `settlementStatus`, `isUuid`, `localDate`), tested by `frontend/test/expenseMath.test.mjs`
- Shared: `Screen`, `ScreenHeader`, `ActionBar`, `Card`, `Chip`, `FilterChipRow`, `SegmentedControl`, `StatusBadge`, `PersonRow`, `BottomSheet`, `TextField`, `useConfirm`, `notify`, `EmptyState`, `ErrorState`, `LoadingState`, `formatMoney`/`formatDate`

## API Surface (`frontend/src/modules/expenses/api.ts`)

- `listExpenseGroups` / `createExpenseGroup` / `getExpenseGroup` -> `GET|POST /api/v1/expenses/groups`, `GET /groups/{id}`
- `listGroupMembers` / `addGroupMember` / `removeGroupMember` -> `GET|POST /groups/{id}/members` (`{ userId }`, owner only), `DELETE /groups/{id}/members/{userId}` (owner removes; a member leaves with their own id; the owner cannot leave)
- `listGroupExpenses` / `createExpense` -> `GET|POST /groups/{id}/expenses`
- `listBalances` -> `GET /balances`; `listSettlements` -> `GET /settlements`; `recordSettlement` -> `POST /groups/{id}/settlements`; `updateSettlementStatus` -> `PATCH /settlements/{id}`

## Demo Fixtures

- None. Screens use live backend queries, loading states, and error/empty states.

## State Patterns

- Loading / error states render inside `Screen` with the `ScreenHeader` (back button) visible; every list supports pull-to-refresh.
- Errors from mutations go through `showError` (works on web) or an inline `role="alert"` text; nothing reports success before the server accepted it.
- Every mutation invalidates the `['expenses']` prefix.

## Navigation Actions and Cross-Module Links

- Home -> Add expense (primary), group cards, Manage groups, Settle up (`/expenses/balances`), All settlements
- Group details -> Add expense (`/expenses/add?groupId=`), Balances, Settlements; back falls back to `/expenses/groups`
- Balances / Settlements back to `/expenses`; Add expense back to `/expenses`

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/expenses*` are thin wrappers and all call `useRequireAuth('/sign-in')` (including `app/expenses.tsx`).
- Amounts: never `$` + `toFixed`; always `formatMoney(amount, currency)` with the row's or group's currency. Totals are kept per currency (`sumByCurrency`/`netByCurrency`) and never added across currencies.
- `parseAmount` accepts `12`, `12.5`, `.5`, `1,000.25`; rejects `12abc`, `-3`, `1,00`, `1e3`; rounds half-up to cents; max 99,999,999.99 (server `DECIMAL(10,2)`).
- `expenseDate` is a server `LocalDate`; render it through `localDate()` so it is not shifted a day west of UTC.
- Member labels stay `You` / `Member XXXX` (no profile directory). Adding members needs a user id; the app has no member search, so the picker uses people from your chats (`@/modules/chat` public API) or a pasted UUID.

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All inputs have `accessibilityLabel`
- Focus ring: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Safe area insets always respected

## Current Implementation Status

- **Live**: all six screens use the backend endpoints above, on shared primitives with dark mode and no hex literals.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.

- Recent backend fixes: added missing `import com.manabandhu.backend.foundation.CatalogScreenContent;` to `ExpensesController` so the `@GetMapping("/screens/{screenId}")` endpoint compiles against the `ExpensesContentService` switch.
- Fallback cleanup: deleted `expensesFallbacks.ts` and removed inline fallbacks from `ExpensesHomeScreen`, `ExpenseGroupsScreen`, `BalancesScreen`, `GroupDetailsScreen`, and `SettlementsScreen` in favor of live backend endpoints, loading states, and error/empty states; added resilient `DEFAULT_EXPENSES_DATA` fallback to `ExpensesScreen` to avoid mobile network blockages; updated group details route with `useLocalSearchParams`.
- Shared Expenses Hub overhaul: replaced generic `FeatureScreen` placeholder in `ExpensesHomeScreen.tsx` with dedicated Flatmate Splitwise & Shared Expenses screen featuring net balance hero card ("+$75.00 You are owed"), quick split action cards, multi-tab view (Active Groups, Who Owes Whom, Recent Splits), and interactive Zelle/Venmo settlement modal. Matching Stitch screen: `b542ab6def1c4837882b82929c0744db`.
- Add Expense form modernization: upgraded `AddExpenseScreen.tsx` with category selector chips, formatted currency amount input, 50/50 vs individual settlement split rules, and success summary card.
- Repo-Wide Code Review & Defect Remediation: Enforced `keyboardShouldPersistTaps="handled"` on `AddExpenseScreen.tsx` ScrollView, added `hitSlop` on back button, and verified dynamic group route parameters (`/expenses/groups/[groupId]`).
- Net Debt Ledger & Settlements (superseded by the 2026-10 hardening below; the screens no longer write to Supabase directly): Added Supabase persistence tables (`expense_groups`, `expenses`, `expense_splits`, `settlements`, `expense_group_members`). Enhanced `BalancesScreen.tsx` with pairwise "Who Owes Whom" net balance calculation and 1-tap "Settle Up" action that zeroes out debt between users and logs a verified settlement record in `SettlementsScreen.tsx`.
- Security & correctness hardening (2026-10): Expenses go through the backend only (the previous direct Supabase writes always failed against RLS and returned fake success objects). Groups are private to members (`expense_group_members`; owners are backfilled in V31 and added on create). Endpoints: `GET/POST /groups`, `GET/PATCH/DELETE /groups/{id}`, `GET/POST/DELETE /groups/{id}/members`, `GET/POST /groups/{id}/expenses` (caller pays; equal split to the cent), `GET /balances` and `/groups/{id}/balances` (pairwise net of unpaid splits minus completed settlements), `GET /settlements` (caller's), `POST /groups/{id}/settlements` (caller must be a party; both parties must be members; statuses `pending|completed|cancelled`). Past expense dates are allowed. Screens (groups, group detail, add expense, balances, settlements) show live data and real errors; members are labelled `You` or `Member XXXX` until a profile directory exists.
- No invented numbers (2026-10): removed `DEFAULT_EXPENSES_DATA` and every hard-coded group, balance, activity row and the fake "Settle via Zelle" modal from `ExpensesHomeScreen` (`/expenses`). The home view reads `GET /api/v1/expenses/groups`, `/balances` and `/settlements`; net / owed / owe and per-group badges are computed from balances involving the signed-in user (`useAuthStore` user id), summed per currency; Recent Activity lists the latest 10 settlements. No groups shows `EmptyState` ("Create group" -> `/expenses/groups`); any failed request shows `ErrorState` with retry. "Settle up" buttons navigate to `/expenses/balances`, which records real settlements. `getExpensesScreen` is no longer used by the home screen.
- Screen metrics are computed from the database (2026-10): `ExpensesContentService.screen(id, Optional<Actor>)` derives home (active groups, "You owe"/"Owed to you" from `ExpenseBalanceService.balancesFor`, per currency, `$` + two decimals for USD), groups (group count, distinct members via `ExpenseAccess.memberCountAcrossGroupsOf`), balances (open balances, completed settlement totals) and settlements (pending/completed counts via `SettlementRepository.countForUserWithStatus`) for the caller only; anonymous viewers and the `add` screen get no metrics.
- Currency guard (2026-10): expenses and settlements must use the group's currency (`ExpenseAccess.groupCurrency`, 400 otherwise) because balances have no currency dimension.
- Cleanup: removed the unused `index.ts` barrel and unused API exports; content service uses `CatalogContent`.
- Amounts render with `formatMoney(amount, currency, { absolute: true })` from `@manabandhu/core`; the sign is conveyed by the surrounding "+" / "You owe" copy.
- Review follow-up: `ExpensesHomeScreen` uses the `color.warm` design-system token instead of a hard-coded `#ff7e33`, and `formatDate(…, "short")` from `@manabandhu/core` for settlement dates.
- Public API: `expenses/index.ts` exports `moduleMeta` (launcher entry).
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.
- P0 settlement fixes (2026-10-10): a debtor can no longer clear a debt alone. `SettlementService.create` decides the status: the payer's record is `pending` until the recipient confirms it; the recipient (or an admin) may record a received payment as `completed`. `settledAt` is always server time (removed from both inputs). Only one pending record per group/payer/recipient (409). `PATCH /settlements/{id}` locks the row (`findByIdForUpdate`) and allows only `pending → completed` (recipient/admin) and `pending → cancelled` (either party); completed and cancelled are final (409). Balances count only completed settlements, so a pending payment leaves the balance in place. `BalancesScreen` tells the payer the recipient must confirm; `SettlementsScreen` shows the status with token colours, a "Confirm received" button for the recipient and "Cancel payment" for either party (`updateSettlementStatus`).
- Launcher keywords (2026-10-12): `module.ts` sets `keywords: ['split', 'bills', 'rent share', 'settle up', 'balances', 'roommate costs']` (`ModuleMeta.keywords`), which Explore search matches by word prefix alongside the label, summary and category. Keep them to things this module does today.
- P0/P1 pass (2026-10-13): all six screens rebuilt on `Screen`/`ScreenHeader` (back buttons, pull-to-refresh, loading/error inside the frame) with no `StyleSheet` or hex; `useRequireAuth` on `/expenses`. Group members are managed for real (add from chat contacts or by UUID, remove/leave with destructive confirms). Balances are grouped per currency and every amount uses `formatMoney` with its currency. Settle-up and confirm-received ask first; cancel payment is a red confirm. Strict amount parsing + category-by-id in `expenseMath.ts` (unit tested). The single-option split picker, the success screen, duplicate Add/Settle buttons, and the hand-rolled tabs were removed. Not done: per-expense detail/edit, group edit/delete UI, group balances endpoint use, profile names.
- Membership integrity (2026-10-14):
  - `ExpenseGroupService.addMember` returns 404 "No ManaBandhu account has that member id" unless the id exists in `auth.users` (`ExpenseAccess.userExists`). `expense_splits.user_id` references `auth.users`, so an unknown member id used to break every later expense in the group. No FK was added (the service check covers it without risking existing rows).
  - `removeMember` (remove or leave) returns 409 while the person has any open pairwise balance in the group (`ExpenseBalanceService.openBalancesOf`): once they are gone nobody could record the settlement.
  - Tests: `ExpenseGroupServiceTest`; smoke: unknown id 404, leave/remove with a balance 409, settled member leaves 204. OpenAPI documents `GET /groups/{id}/members`, `DELETE /groups/{id}/members/{userId}` and `GET /groups/{id}/balances`.
  - Frontend: `GroupDetailsScreen` reads `GET /groups/{id}/balances` (`listGroupBalances`), marks members with an open balance, and Remove/Leave then offers "Open balances" instead of removing; leaving navigates before invalidating. `AddExpenseScreen` sends the local `expenseDate` (`toLocalDateString`).
- Visual QA pass (2026-10-14, offline stack, 390/768/1440 light+dark): the home tab that lists settlements is labelled "Settlements" (it was "Activity" but only ever held settlements); the balance action reads "Mark $X received" / "Record paying $X" because the row already names the person and the longer label was cut off on phones.
