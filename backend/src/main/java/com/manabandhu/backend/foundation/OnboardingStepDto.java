package com.manabandhu.backend.foundation;

import java.util.List;

public record OnboardingStepDto(
        String stepKey,
        int stepOrder,
        String title,
        String subtitle,
        boolean isMultiSelect,
        boolean isRequired,
        List<OnboardingOptionDto> options
) {}
