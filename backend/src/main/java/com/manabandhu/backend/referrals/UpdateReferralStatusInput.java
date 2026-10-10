package com.manabandhu.backend.referrals;

import jakarta.validation.constraints.Size;

public record UpdateReferralStatusInput(
        @jakarta.validation.constraints.NotBlank @Size(max = 20) String status) {}
