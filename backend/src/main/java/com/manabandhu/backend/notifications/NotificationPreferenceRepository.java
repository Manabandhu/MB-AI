package com.manabandhu.backend.notifications;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, UUID> {
    Optional<NotificationPreference> findByUserIdAndChannel(UUID userId, NotificationPreference.Channel channel);
    List<NotificationPreference> findByUserId(UUID userId);
}
