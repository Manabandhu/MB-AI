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

- `frontend/src/modules/expenses/expensesFallbacks.ts` - demo fixtures for all expense screens

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
- `ExpensesScreen` uses `useQuery` with fallback data from `expensesFallbacks.ts`
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
