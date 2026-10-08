package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** Currency defaults to the group's currency and the date to today; past dates are allowed. */
public record CreateExpenseInput(
        @NotNull @Positive @Digits(integer = 8, fraction = 2) BigDecimal amount,
        @Pattern(regexp = "^[A-Z]{3}$") String currency,
        @Size(max = 150) String title,
        @Size(max = 4000) String description,
        @Size(max = 50) String category,
        @Pattern(regexp = "^(EQUAL|EXACT|PERCENTAGE)$") String splitType,
        LocalDate expenseDate) {}
