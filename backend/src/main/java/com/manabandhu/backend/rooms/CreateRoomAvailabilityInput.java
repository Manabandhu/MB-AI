package com.manabandhu.backend.rooms;

import java.time.LocalDate;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record CreateRoomAvailabilityInput(
        @NotNull LocalDate availableFrom,
        @NotNull LocalDate availableTo,
        @PositiveOrZero @Max(36) int minStayMonths) {

    @AssertTrue(message = "availableTo must be on or after availableFrom")
    boolean isRangeValid() {
        return availableFrom == null || availableTo == null || !availableTo.isBefore(availableFrom);
    }
}
