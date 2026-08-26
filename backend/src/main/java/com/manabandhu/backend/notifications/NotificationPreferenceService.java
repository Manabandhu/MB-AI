package com.manabandhu.backend.notifications;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository repository;

    NotificationPreferenceService(NotificationPreferenceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<NotificationPreference> findByUser(UUID userId) {
        return repository.findByUserId(userId);
    }

    @Transactional
    public NotificationPreference set(UUID userId, NotificationPreference.Channel channel, boolean enabled) {
        return repository.findByUserIdAndChannel(userId, channel)
                .map(pref -> { pref.setEnabled(enabled); return pref; })
                .orElseGet(() -> repository.save(new NotificationPreference(userId, channel, enabled)));
    }
}
