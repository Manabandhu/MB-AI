package com.manabandhu.backend.immigration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateImmigrationGuideInput(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 4000) String description,
        @NotBlank @Size(max = 4000) String content,
        @NotBlank @Size(max = 80) String category,
        @NotBlank String difficultyLevel,
        int estimatedDurationMinutes) {}
