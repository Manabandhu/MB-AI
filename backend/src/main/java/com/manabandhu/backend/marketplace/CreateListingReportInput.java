package com.manabandhu.backend.marketplace;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateListingReportInput(
        @NotBlank @Size(max = 80) String reason,
        @Size(max = 4000) String description) {}
