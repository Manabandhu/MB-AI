package com.manabandhu.backend.onboarding;

import java.util.Map;

public record SaveOnboardingStepInput(
        String stepKey,
        Map<String, Object> payload
) {}
