package com.manabandhu.backend.expenses;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface SettlementRepository extends JpaRepository<Settlement, UUID> {
    List<Settlement> findByGroupIdOrderByCreatedAtDesc(UUID groupId);
    Optional<Settlement> findById(UUID id);
}
