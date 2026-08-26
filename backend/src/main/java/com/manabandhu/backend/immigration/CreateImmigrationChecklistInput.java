package com.manabandhu.backend.immigration;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateImmigrationChecklistInput(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 4000) String description,
        @NotBlank @Size(max = 80) String category,
        @NotBlank @Size(max = 4000) String itemsJson,
        Instant dueDate) {}
