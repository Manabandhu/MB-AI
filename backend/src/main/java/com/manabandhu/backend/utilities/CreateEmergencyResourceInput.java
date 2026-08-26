package com.manabandhu.backend.utilities;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateEmergencyResourceInput(
        @NotBlank @Size(max = 200) String name,
        @NotBlank @Size(max = 80) String category,
        @NotBlank @Size(max = 400) String address,
        @Size(max = 20) String phone,
        @Size(max = 120) String hours,
        @NotBlank @Size(max = 4000) String description,
        double latitude,
        double longitude) {}
