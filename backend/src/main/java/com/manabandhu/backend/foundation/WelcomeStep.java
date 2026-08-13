package com.manabandhu.backend.foundation;

public record WelcomeStep(
        String id,
        String title,
        String body,
        String imageUrl,
        String actionLabel,
        String secondaryActionLabel) {
}
