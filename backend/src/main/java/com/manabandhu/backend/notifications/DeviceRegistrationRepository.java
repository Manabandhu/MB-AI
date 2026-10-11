package com.manabandhu.backend.notifications;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface DeviceRegistrationRepository extends JpaRepository<DeviceRegistration, UUID> {
    Optional<DeviceRegistration> findByDeviceToken(String deviceToken);

    List<DeviceRegistration> findByUserIdAndEnabledTrue(UUID userId);
}
