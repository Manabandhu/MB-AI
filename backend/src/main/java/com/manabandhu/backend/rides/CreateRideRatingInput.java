package com.manabandhu.backend.rides;

import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/** {@code rateeId} may be omitted by a passenger, in which case the driver is rated. */
public record CreateRideRatingInput(
        UUID rateeId,
        @Min(1) @Max(5) int rating,
        @Size(max = 4000) String comment) {}
