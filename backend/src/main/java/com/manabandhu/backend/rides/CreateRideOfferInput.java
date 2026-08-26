package com.manabandhu.backend.rides;

import java.time.Instant;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateRideOfferInput(
        @NotBlank @Size(max = 200) String originArea,
        @NotBlank @Size(max = 200) String destinationArea,
        @NotNull @Future Instant departureAt,
        @Positive int seatsTotal,
        @NotBlank @Size(max = 200) String contribution) {}
