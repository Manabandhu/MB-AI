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

- `ExpensesScreen` - multi-mode screen driven by `screenId` prop
- `ExpenseGroupsScreen` - list of expense groups
- `GroupDetailsScreen` - group expenses and balances with tabs
- `AddExpenseScreen` - form to add new expense with validation
- `BalancesScreen` - balances across groups
- `SettlementsScreen` - view and process settlements
- Shared: `FeatureScreen`, `CatalogScreen`, `MetricCard`, `Card`, `AppButton`, `DetailScreen`, `SectionHeader`, `ListScreen`, `TabBar`, `FormScreen`, `Input`, `Select`, `DateTimePicker`, `EmptyState`, `ErrorState`, `LoadingState`

## API Surface

- `getExpensesScreen(screenId)` -> `GET /api/v1/expenses/screens/{screenId}`
- Backend endpoints for groups, balances, settlements, and add expense are pending full contract definition.

## Demo Fixtures

- Demo fixtures removed; screens use live backend queries, loading states, and error/empty states.

## State Patterns

- **Loading**: `LoadingState` while expenses load
- **Empty**: `EmptyState` when no groups or expenses exist
- **Error**: `ErrorState` with retry action
- **Success**: confirmation after adding expense or settling
- **Offline**: offline banner with cached data
- **Permission**: group membership enforced server-side

## Navigation Actions and Cross-Module Links

- Home actions: Groups, Add expense, Balances, Settlements
- Group details -> Add expense, Balances, Settlements
- Balances -> Settlements, Groups
- Settlements -> Balances, Groups

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/expenses/` are thin wrappers
- `ExpensesScreen` uses `useQuery` with live data from `GET /api/v1/expenses/screens/{screenId}`
- `FeatureScreen` provides adaptive catalog/list layout
- `AddExpenseScreen` uses `react-hook-form` + `zod` + `@hookform/resolvers`
- Money is stored as exact minor units with currency; no floating-point arithmetic

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All inputs have `accessibilityLabel`
- Focus ring: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Safe area insets always respected

## Current Implementation Status

- **Partial**: Home via `FeatureScreen` is complete. Expense groups, group details, balances, and settlements are UI-complete with demo fallbacks. Add expense form is implemented with local validation. Backend API for expenses is not yet fully defined.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.

- Recent backend fixes: added missing `import com.manabandhu.backend.foundation.CatalogScreenContent;` to `ExpensesController` so the `@GetMapping("/screens/{screenId}")` endpoint compiles against the `ExpensesContentService` switch.
- Fallback cleanup: deleted `expensesFallbacks.ts` and removed inline fallbacks from `ExpensesHomeScreen`, `ExpenseGroupsScreen`, `BalancesScreen`, `GroupDetailsScreen`, and `SettlementsScreen` in favor of live backend endpoints, loading states, and error/empty states; added resilient `DEFAULT_EXPENSES_DATA` fallback to `ExpensesScreen` to avoid mobile network blockages; updated group details route with `useLocalSearchParams`.
- Shared Expenses Hub overhaul: replaced generic `FeatureScreen` placeholder in `ExpensesHomeScreen.tsx` with dedicated Flatmate Splitwise & Shared Expenses screen featuring net balance hero card ("+$75.00 You are owed"), quick split action cards, multi-tab view (Active Groups, Who Owes Whom, Recent Splits), and interactive Zelle/Venmo settlement modal. Matching Stitch screen: `b542ab6def1c4837882b82929c0744db`.
- Add Expense form modernization: upgraded `AddExpenseScreen.tsx` with category selector chips, formatted currency amount input, 50/50 vs individual settlement split rules, and success summary card.
- Repo-Wide Code Review & Defect Remediation: Enforced `keyboardShouldPersistTaps="handled"` on `AddExpenseScreen.tsx` ScrollView, added `hitSlop` on back button, and verified dynamic group route parameters (`/expenses/groups/[groupId]`).
- Net Debt Ledger & Settlements: Added Supabase persistence tables (`expense_groups`, `expenses`, `expense_splits`, `settlements`, `expense_group_members`). Enhanced `BalancesScreen.tsx` with pairwise "Who Owes Whom" net balance calculation and 1-tap "Settle Up" action that zeroes out debt between users and logs a verified settlement record in `SettlementsScreen.tsx`.

