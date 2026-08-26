package com.manabandhu.backend.rides;

import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateRideRatingInput(
        @NotNull UUID rateeId,
        @NotNull @Min(1) @Max(5) int rating,
        @Size(max = 4000) String comment) {}
