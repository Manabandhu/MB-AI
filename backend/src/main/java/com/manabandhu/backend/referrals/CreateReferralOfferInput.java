package com.manabandhu.backend.referrals;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateReferralOfferInput(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 4000) String description,
        @NotBlank @Size(max = 100) String serviceType,
        @Size(max = 4000) String availability,
        @Size(max = 4000) String terms,
        Instant expiresAt) {}
