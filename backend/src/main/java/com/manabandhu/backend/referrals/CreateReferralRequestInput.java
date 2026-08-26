package com.manabandhu.backend.referrals;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateReferralRequestInput(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 4000) String description,
        @NotBlank @Size(max = 100) String category,
        @Size(max = 4000) String details,
        @NotBlank @Size(max = 20) String urgency,
        @Size(max = 4000) String desiredOutcome) {}
