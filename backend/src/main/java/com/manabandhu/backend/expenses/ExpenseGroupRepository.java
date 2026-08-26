package com.manabandhu.backend.expenses;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ExpenseGroupRepository extends JpaRepository<ExpenseGroup, UUID> {
    List<ExpenseGroup> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
