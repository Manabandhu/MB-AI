package com.manabandhu.backend.notifications;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DeviceRegistrationService {

    private final DeviceRegistrationRepository repository;

    DeviceRegistrationService(DeviceRegistrationRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<DeviceRegistration> findActiveByUser(UUID userId) {
        return repository.findByUserIdAndEnabledTrue(userId);
    }

    @Transactional
    public DeviceRegistration register(UUID userId, String deviceToken, DeviceRegistration.Platform platform, boolean enabled) {
        return repository.save(new DeviceRegistration(userId, deviceToken, platform, enabled));
    }

    @Transactional
    public void touch(UUID id) {
        repository.findById(id).ifPresent(DeviceRegistration::markUsed);
    }

    @Transactional
    public void disable(UUID id) {
        repository.findById(id).ifPresent(reg -> { reg.setEnabled(false); });
    }
}
