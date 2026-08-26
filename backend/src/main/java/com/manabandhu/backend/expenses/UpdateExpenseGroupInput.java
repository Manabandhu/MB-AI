package com.manabandhu.backend.expenses;

import jakarta.validation.constraints.Size;

public record UpdateExpenseGroupInput(
        @Size(max = 120) String name,
        @Size(max = 4000) String description) {}
