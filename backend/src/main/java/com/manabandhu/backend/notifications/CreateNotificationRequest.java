package com.manabandhu.backend.notifications;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateNotificationRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 4000) String body,
        @NotBlank String type,
        @Size(max = 200) String actionRoute) {}
