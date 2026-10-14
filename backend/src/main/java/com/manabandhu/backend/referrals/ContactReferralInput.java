package com.manabandhu.backend.referrals;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactReferralInput(@NotBlank @Size(min = 20, max = 2000) String message) {}
