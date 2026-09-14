package com.manabandhu.backend.foundation;

import java.util.Map;
import java.util.UUID;

public record OnboardingOptionDto(
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
