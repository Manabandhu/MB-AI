package com.manabandhu.backend.foundation;

import java.util.Map;

public record SaveStepRequest(
        String stepKey,
        Map<String, Object> payload
) {}
