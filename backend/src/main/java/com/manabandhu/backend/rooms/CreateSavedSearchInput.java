package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CreateSavedSearchInput(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 200) String query,
        @Size(max = 200) String city,
        @Size(max = 200) String broadLocation,
        @Size(max = 50) String roomType,
        @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal minPrice,
        @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal maxPrice,
        LocalDate availableFrom,
        Boolean furnished,
        Boolean alertsEnabled) {

    @AssertTrue(message = "minPrice must not exceed maxPrice")
    boolean isPriceRangeValid() {
        return minPrice == null || maxPrice == null || minPrice.compareTo(maxPrice) <= 0;
    }
}

record UpdateSavedSearchInput(
        @Size(max = 120) String name,
        @Size(max = 200) String query,
        @Size(max = 200) String city,
        @Size(max = 200) String broadLocation,
        @Size(max = 50) String roomType,
        @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal minPrice,
        @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal maxPrice,
        LocalDate availableFrom,
        Boolean furnished,
        Boolean alertsEnabled) {

    @AssertTrue(message = "minPrice must not exceed maxPrice")
    boolean isPriceRangeValid() {
        return minPrice == null || maxPrice == null || minPrice.compareTo(maxPrice) <= 0;
    }
}
