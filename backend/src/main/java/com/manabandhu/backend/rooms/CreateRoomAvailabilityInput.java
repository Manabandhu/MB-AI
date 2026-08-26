package com.manabandhu.backend.rooms;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record CreateRoomAvailabilityInput(
        @NotNull LocalDate availableFrom,
        @NotNull LocalDate availableTo,
        @PositiveOrZero int minStayMonths) {}
