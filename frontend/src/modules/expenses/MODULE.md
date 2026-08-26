# Expenses

Owns expense groups, entries, balances, settlements, currency precision, participant permissions, history, and audit-friendly calculations.

The first Stitch batch routes `/expenses`, `/expenses/groups`, `/expenses/groups/[groupId]`, `/expenses/add`, `/expenses/balances`, and `/expenses/settlements` share `screens/ExpensesHomeScreen.tsx`, `expensesFallbacks.ts`, and the read-only demo endpoint `GET /api/v1/expenses/screens/{screenId}`.

Additional screens: `ExpenseGroupsScreen`, `GroupDetailsScreen`, `AddExpenseScreen`, `BalancesScreen`, `SettlementsScreen`.
