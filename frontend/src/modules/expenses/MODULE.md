# Expenses

Owns expense groups, entries, balances, settlements, currency precision, participant permissions, history, and audit-friendly calculations.

## Routes (all require sign-in)
- `/expenses` -> `ExpensesScreen`: per-currency balance card, Groups / Balances / Activity tabs, one primary "Add expense".
- `/expenses/groups` -> `ExpenseGroupsScreen`: create a group, list groups.
- `/expenses/groups/[groupId]` -> `GroupDetailsScreen`: expenses, members (owner adds from chat contacts or by member id, removes; members leave; both blocked while the person has an open balance), Add expense.
- `/expenses/add` -> `AddExpenseScreen`: group, amount (strict, rounded to cents), title, category by id; equal split.
- `/expenses/balances` -> `BalancesScreen`: who owes whom per currency; confirmed "Record payment" / "Mark received".
- `/expenses/settlements` -> `SettlementsScreen`: payment history; confirm received, cancel (red confirm).

## API (`api.ts`, all under `/api/v1/expenses`)
- `GET|POST /groups`, `GET /groups/{id}`, `GET|POST /groups/{id}/members`, `DELETE /groups/{id}/members/{userId}`
- `GET|POST /groups/{id}/expenses`, `GET /groups/{id}/balances`, `GET /balances`, `GET /settlements`, `POST /groups/{id}/settlements`, `PATCH /settlements/{id}`

## Helpers
- `expenseMath.ts`: `parseAmount`, `EXPENSE_CATEGORIES`, `categoryLabel`, `sumByCurrency`, `netByCurrency`, `settlementStatus`, `isUuid`, `localDate` (tested by `frontend/test/expenseMath.test.mjs`). Amounts in different currencies are never added.
