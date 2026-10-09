package com.manabandhu.backend.expenses;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface SettlementRepository extends JpaRepository<Settlement, UUID> {
    List<Settlement> findByGroupIdOrderByCreatedAtDesc(UUID groupId);

    List<Settlement> findByGroupIdIn(List<UUID> groupIds);

    List<Settlement> findByFromUserIdOrToUserIdOrderByCreatedAtDesc(UUID fromUserId, UUID toUserId);

    Optional<Settlement> findById(UUID id);

    /** Settlements the user paid or received with the given lowercase status. */
    @Query("SELECT COUNT(s) FROM Settlement s WHERE (s.fromUserId = :userId OR s.toUserId = :userId) AND LOWER(s.status) = :status")
    long countForUserWithStatus(@Param("userId") UUID userId, @Param("status") String status);

    /** Completed settlement totals the user paid or received, one row per currency: {currency, amount}. */
    @Query("SELECT s.currency, SUM(s.amount) FROM Settlement s WHERE (s.fromUserId = :userId OR s.toUserId = :userId) "
            + "AND LOWER(s.status) = 'completed' GROUP BY s.currency ORDER BY s.currency")
    List<Object[]> completedTotalsForUser(@Param("userId") UUID userId);
}
