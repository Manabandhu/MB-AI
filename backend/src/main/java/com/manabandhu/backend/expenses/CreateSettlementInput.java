package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSettlementInput(
        @NotBlank UUID toUserId,
        @NotBlank BigDecimal amount,
        @NotBlank @Size(min = 3, max = 3) String currency,
        @NotBlank @Size(max = 20) String status,
        Instant settledAt) {}
