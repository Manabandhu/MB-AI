package com.manabandhu.backend.foundation;

import java.util.List;

public record OnboardingConfigResponse(
        List<OnboardingStepDto> steps
) {}
