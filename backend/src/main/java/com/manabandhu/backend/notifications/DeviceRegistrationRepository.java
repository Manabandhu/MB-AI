package com.manabandhu.backend.notifications;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface DeviceRegistrationRepository extends JpaRepository<DeviceRegistration, UUID> {
    List<DeviceRegistration> findByUserIdAndEnabledTrue(UUID userId);
    List<DeviceRegistration> findByUserId(UUID userId);
}
