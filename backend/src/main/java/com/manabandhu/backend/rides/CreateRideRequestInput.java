package com.manabandhu.backend.rides;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateRideRequestInput(
        @NotNull @Positive int seatsRequested,
        @Size(max = 4000) String message) {}
