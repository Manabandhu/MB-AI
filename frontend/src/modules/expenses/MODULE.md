# Expenses

Owns expense groups, entries, balances, settlements, currency precision, participant permissions, history, and audit-friendly calculations.

The routes `/expenses`, `/expenses/groups`, `/expenses/groups/[groupId]`, `/expenses/add`, `/expenses/balances`, and `/expenses/settlements` connect to the backend endpoint `GET /api/v1/expenses/screens/{screenId}` and module APIs with live queries and error/empty states.

Additional screens: `ExpenseGroupsScreen`, `GroupDetailsScreen`, `AddExpenseScreen`, `BalancesScreen`, `SettlementsScreen`.
