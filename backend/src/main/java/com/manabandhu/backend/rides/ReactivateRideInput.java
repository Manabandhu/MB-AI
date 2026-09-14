package com.manabandhu.backend.rides;

import java.time.Instant;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

public record ReactivateRideInput(
        @NotNull @Future Instant newDepartureAt) {}
