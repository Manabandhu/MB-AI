package com.manabandhu.backend.rides;

import java.math.BigDecimal;
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
        @NotBlank @Size(max = 200) String contribution,
        Double originLat,
        Double originLng,
        Double destinationLat,
        Double destinationLng,
        String routePolyline,
        BigDecimal distanceMiles,
        Integer estimatedDurationMins,
        String tollPreference,
        BigDecimal estimatedTollAmount,
        Boolean isRecurring,
        String recurrencePattern,
        String[] recurringDays,
        String luggageCapacity,
        String genderPreference) {

    public CreateRideOfferInput(String originArea, String destinationArea, Instant departureAt, int seatsTotal, String contribution) {
        this(originArea, destinationArea, departureAt, seatsTotal, contribution,
                null, null, null, null, null, null, null, "AVOID_TOLLS", BigDecimal.ZERO, false, "ONE_TIME", new String[]{}, "MEDIUM", "ANY");
    }
}
