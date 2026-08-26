package com.manabandhu.backend.expenses;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, UUID> {
    List<ExpenseSplit> findByExpenseId(UUID expenseId);

    List<ExpenseSplit> findByExpenseIdAndUserId(UUID expenseId, UUID userId);
}
