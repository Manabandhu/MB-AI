package com.manabandhu.backend.notifications;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);
    long countByUserIdAndReadFalse(UUID userId);

    /**
     * Claims a batch of undispatched notifications. SKIP LOCKED lets several backend instances run the
     * dispatcher at once without sending the same push twice.
     */
    @Query(value = """
            SELECT * FROM public.notifications
            WHERE dispatched = false
              AND dispatch_attempts < :maxAttempts
              AND (next_dispatch_at IS NULL OR next_dispatch_at <= now())
            ORDER BY created_at ASC
            LIMIT :limit
            FOR UPDATE SKIP LOCKED
            """, nativeQuery = true)
    List<Notification> claimUndispatched(@Param("limit") int limit, @Param("maxAttempts") int maxAttempts);
}
