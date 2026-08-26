package com.manabandhu.backend.safety;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSafetyReportInput(
        @NotBlank String targetId,
        @NotBlank @Size(max = 80) String category,
        @NotBlank @Size(max = 4000) String description,
        @NotBlank String severity,
        @Size(max = 2000) String evidenceUrls) {}
