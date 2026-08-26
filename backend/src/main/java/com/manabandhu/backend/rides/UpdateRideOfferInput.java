package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UpdateRideOfferInput(
        @Size(max = 200) String originArea,
        @Size(max = 200) String destinationArea,
        @Future Instant departureAt,
        @Positive Integer seatsTotal,
        @Positive Integer seatsAvailable,
        @Size(max = 200) String contribution,
        @Size(max = 20) String status) {}
