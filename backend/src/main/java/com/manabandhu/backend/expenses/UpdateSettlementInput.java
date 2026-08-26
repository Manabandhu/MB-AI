package com.manabandhu.backend.expenses;

import java.time.Instant;

import jakarta.validation.constraints.Size;

public record UpdateSettlementInput(
        @Size(max = 20) String status,
        Instant settledAt) {}
