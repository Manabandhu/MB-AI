package com.manabandhu.backend.notifications;

import jakarta.validation.constraints.NotBlank;

public record SetPreferenceRequest(
        @NotBlank String channel,
        boolean enabled) {}
