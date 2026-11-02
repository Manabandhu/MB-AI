package com.manabandhu.backend.onboarding;

import java.util.List;

public record OnboardingConfigResponse(
        List<OnboardingStepView> steps
) {}
