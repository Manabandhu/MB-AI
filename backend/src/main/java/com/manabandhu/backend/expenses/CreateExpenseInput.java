package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateExpenseInput(
        @NotBlank BigDecimal amount,
        @NotBlank @Size(min = 3, max = 3) String currency,
        @Size(max = 4000) String description,
        @Size(max = 50) String category,
        @NotBlank LocalDate expenseDate) {}
