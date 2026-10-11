package com.manabandhu.backend.rides;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CreateRideOfferInput(
        @NotBlank @Size(max = 200) String originArea,
        @NotBlank @Size(max = 200) String destinationArea,
        @NotNull @Future Instant departureAt,
        @Positive @Max(RideInputRules.MAX_SEATS) int seatsTotal,
        @NotBlank @Size(max = 200) String contribution,
        @DecimalMin("-90.0") @DecimalMax("90.0") Double originLat,
        @DecimalMin("-180.0") @DecimalMax("180.0") Double originLng,
        @DecimalMin("-90.0") @DecimalMax("90.0") Double destinationLat,
        @DecimalMin("-180.0") @DecimalMax("180.0") Double destinationLng,
        @Size(max = 20000) String routePolyline,
        @PositiveOrZero @Digits(integer = 4, fraction = 2) BigDecimal distanceMiles,
        @PositiveOrZero @Max(60 * 48) Integer estimatedDurationMins,
        @Pattern(regexp = RideInputRules.TOLLS) String tollPreference,
        @PositiveOrZero @Digits(integer = 6, fraction = 2) BigDecimal estimatedTollAmount,
        Boolean isRecurring,
        @Pattern(regexp = RideInputRules.RECURRENCE) String recurrencePattern,
        @Size(max = 7) String @Pattern(regexp = RideInputRules.DAY) [] recurringDays,
        @Pattern(regexp = RideInputRules.LUGGAGE) String luggageCapacity,
        @Pattern(regexp = RideInputRules.GENDER) String genderPreference) {

    public CreateRideOfferInput(String originArea, String destinationArea, Instant departureAt, int seatsTotal, String contribution) {
        this(originArea, destinationArea, departureAt, seatsTotal, contribution,
                null, null, null, null, null, null, null, "AVOID_TOLLS", BigDecimal.ZERO, false, "ONE_TIME", new String[]{}, "MEDIUM", "ANY");
    }
}
