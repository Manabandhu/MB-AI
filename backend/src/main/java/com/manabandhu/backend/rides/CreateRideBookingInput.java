package com.manabandhu.backend.rides;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateRideBookingInput(
        @NotNull @Positive int seatsBooked) {}
