package com.manabandhu.backend.rides;

import jakarta.validation.constraints.NotBlank;

public record UpdateRideStatusInput(
        @NotBlank String status) {}
