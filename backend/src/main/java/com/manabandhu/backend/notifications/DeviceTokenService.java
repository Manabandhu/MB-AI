package com.manabandhu.backend.notifications;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

/** Expo push tokens for the caller's devices. Only the signed-in owner can register or remove a token. */
@Service
public class DeviceTokenService {

    private static final Pattern EXPO_TOKEN = Pattern.compile("^Expo(nent)?PushToken\\[[A-Za-z0-9_-]{10,180}]$");
    private static final Set<String> PLATFORMS = Set.of("ios", "android");

    private final DeviceRegistrationRepository repository;

    DeviceTokenService(DeviceRegistrationRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public DeviceRegistration register(Actor actor, String token, String rawPlatform) {
        var platform = rawPlatform == null ? "" : rawPlatform.trim().toLowerCase(Locale.ROOT);
        if (token == null || !EXPO_TOKEN.matcher(token.trim()).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "token must be an Expo push token");
        }
        if (!PLATFORMS.contains(platform)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "platform must be ios or android");
        }
        var clean = token.trim();
        var existing = repository.findByDeviceToken(clean);
        if (existing.isPresent()) {
            // Signing in as someone else on the same phone moves the token so the previous account stops receiving.
            existing.get().assignTo(actor.id(), platform);
            return existing.get();
        }
        return repository.save(new DeviceRegistration(actor.id(), clean, platform));
    }

    /** Removes the caller's own token (sign-out or push turned off); someone else's token reads as not found. */
    @Transactional
    public void unregister(Actor actor, String token) {
        var registration = repository.findByDeviceToken(token == null ? "" : token.trim())
                .filter(r -> r.getUserId().equals(actor.id()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Device not registered"));
        repository.delete(registration);
    }

    @Transactional(readOnly = true)
    public List<DeviceRegistration> activeFor(UUID userId) {
        return repository.findByUserIdAndEnabledTrue(userId);
    }

    @Transactional
    public void disable(String token) {
        repository.findByDeviceToken(token).ifPresent(DeviceRegistration::disable);
    }
}
