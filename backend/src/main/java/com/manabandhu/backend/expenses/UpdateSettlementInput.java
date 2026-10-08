package com.manabandhu.backend.expenses;

import java.time.Instant;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record UpdateSettlementInput(
        @NotNull @Pattern(regexp = "^(pending|completed|cancelled)$") String status,
        Instant settledAt) {}
