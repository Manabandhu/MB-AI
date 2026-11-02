package com.manabandhu.backend.onboarding;

import java.util.Map;
import java.util.UUID;

public record OnboardingOptionView(
        UUID id,
        String stepKey,
        String optionKey,
        String label,
        String description,
        String iconName,
        String category,
        int sortOrder,
        Map<String, Object> metadata
) {}
