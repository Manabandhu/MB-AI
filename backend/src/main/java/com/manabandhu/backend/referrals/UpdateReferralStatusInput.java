package com.manabandhu.backend.referrals;

import jakarta.validation.constraints.Size;

public record UpdateReferralStatusInput(
        @Size(max = 20) String status) {}
