package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

/**
 * Records a payment between two group members. {@code fromUserId} defaults to the caller; the caller must be
 * one of the two parties. The server decides the status: a payer's record stays {@code pending} until the
 * recipient confirms it; a recipient may record a received payment as {@code completed}. {@code settledAt}
 * is always set by the server.
 */
public record CreateSettlementInput(
        UUID fromUserId,
        @NotNull UUID toUserId,
        @NotNull @Positive @Digits(integer = 8, fraction = 2) BigDecimal amount,
        @Pattern(regexp = "^[A-Z]{3}$") String currency,
        @Pattern(regexp = "^(pending|completed)$") String status) {}
