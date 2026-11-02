package com.manabandhu.backend.onboarding;

import java.util.List;

public record OnboardingStepView(
        String stepKey,
        int stepOrder,
        String title,
        String subtitle,
        boolean isMultiSelect,
        boolean isRequired,
        List<OnboardingOptionView> options
) {}
