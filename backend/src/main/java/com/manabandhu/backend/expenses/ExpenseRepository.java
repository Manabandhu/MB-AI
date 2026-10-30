package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    List<Expense> findByGroupIdOrderByExpenseDateDesc(UUID groupId);

    List<Expense> findByGroupIdIn(List<UUID> groupIds);

    Optional<Expense> findById(UUID id);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.groupId = :groupId")
    BigDecimal totalForGroup(@Param("groupId") UUID groupId);
}
