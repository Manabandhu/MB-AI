---
name: manabandhu-expenses
description: Maintain ManaBandhu shared expense groups, entries, balances, settlements, currency precision, participant permissions, and financial history. Use for any change under the expenses module or its contracts.
---

# Expenses

1. Read `frontend/src/modules/expenses/MODULE.md` and affected contracts first.
2. Store money as exact minor units with currency; never use floating-point arithmetic for balances.
3. Enforce group membership and mutation permissions server-side and preserve an append-only correction history.
4. Test rounding, unequal splits, deleted participants, multiple currencies, retries, offline state, and settlement races.
5. Update contracts, calculation tests, module documentation, and this skill together.
