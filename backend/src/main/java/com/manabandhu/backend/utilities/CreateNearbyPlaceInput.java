package com.manabandhu.backend.utilities;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateNearbyPlaceInput(
        @NotBlank @Size(max = 200) String name,
        @NotBlank @Size(max = 80) String category,
        @NotBlank @Size(max = 400) String address,
        double latitude,
        double longitude,
        Double rating,
        Double distanceKm,
        @Size(max = 20) String phone) {}
