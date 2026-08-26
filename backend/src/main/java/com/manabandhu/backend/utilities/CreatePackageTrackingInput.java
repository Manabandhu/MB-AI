package com.manabandhu.backend.utilities;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePackageTrackingInput(
        @NotBlank @Size(max = 80) String trackingNumber,
        @NotBlank @Size(max = 80) String carrier,
        @NotBlank String status,
        java.time.Instant estimatedDelivery) {}
