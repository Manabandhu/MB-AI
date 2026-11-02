package com.manabandhu.backend.onboarding;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record OnboardingProgressView(
        UUID userId,
        String currentStep,
        boolean isCompleted,
        List<String> selectedReasons,
        String metroLocation,
        String zipCode,
        String universityCampus,
        String primaryLanguage,
        List<String> secondaryLanguages,
        List<String> interestTags,
        String avatarUrl,
        String bio,
        Map<String, Object> notificationPreferences,
        boolean safetyPledgeAccepted,
        Instant completedAt,
        Instant updatedAt
) {}
