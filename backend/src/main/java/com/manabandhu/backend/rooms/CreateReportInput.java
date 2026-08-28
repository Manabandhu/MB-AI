package com.manabandhu.backend.rooms;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReportInput(
        @NotNull UUID listingId,
        @NotBlank @Size(max = 80) String reason,
        @Size(max = 4000) String description) {}
