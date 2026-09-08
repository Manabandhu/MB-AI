package com.manabandhu.backend.utilities;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateNearbyPlaceInput(
        @NotBlank @Size(max = 200) String name,
        @NotBlank @Size(max = 80) String category,
        @NotBlank @Size(max = 400) String address,
        @DecimalMin("-90.0") @DecimalMax("90.0") double latitude,
        @DecimalMin("-180.0") @DecimalMax("180.0") double longitude,
        @DecimalMin("0.0") @DecimalMax("5.0") Double rating,
        @DecimalMin("0.0") Double distanceKm,
        @Size(max = 20) String phone) {}
