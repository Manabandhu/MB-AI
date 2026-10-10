package com.manabandhu.backend.expenses;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** Confirms ({@code completed}) or cancels a pending settlement; {@code settledAt} is set by the server. */
public record UpdateSettlementInput(
        @NotNull @Pattern(regexp = "^(pending|completed|cancelled)$") String status) {}
