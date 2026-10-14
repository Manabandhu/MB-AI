package com.manabandhu.backend.rooms;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** The listing comes from the path. */
public record CreateReportInput(
        @NotBlank @Size(max = 80) String reason,
        @Size(max = 4000) String description) {}
