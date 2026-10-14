package com.manabandhu.backend.expenses;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateExpenseGroupInput(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 4000) String description,
        @Pattern(regexp = "^(APARTMENT|TRIP|CARPOOL|EVENT)$") String groupType,
        @Pattern(regexp = "^[A-Z]{3}$") String currency) {}
