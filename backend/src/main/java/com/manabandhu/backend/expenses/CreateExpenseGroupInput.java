package com.manabandhu.backend.expenses;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateExpenseGroupInput(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 4000) String description) {}
