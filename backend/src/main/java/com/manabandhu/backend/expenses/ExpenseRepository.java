package com.manabandhu.backend.expenses;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    List<Expense> findByGroupIdOrderByExpenseDateDesc(UUID groupId);
    Optional<Expense> findById(UUID id);
}
