package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

/**
 * Records a payment between two group members. {@code fromUserId} defaults to the caller; the caller must be
 * one of the two parties.
 */
public record CreateSettlementInput(
        UUID fromUserId,
        @NotNull UUID toUserId,
        @NotNull @Positive @Digits(integer = 8, fraction = 2) BigDecimal amount,
        @Pattern(regexp = "^[A-Z]{3}$") String currency,
        @Pattern(regexp = "^(pending|completed|cancelled)$") String status,
        Instant settledAt) {}
