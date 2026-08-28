package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSavedSearchInput(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 200) String query,
        @Size(max = 200) String city,
        @Size(max = 200) String broadLocation,
        @Size(max = 20) String roomType,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        LocalDate availableFrom,
        Boolean furnished,
        Boolean alertsEnabled) {}

record UpdateSavedSearchInput(
        @Size(max = 120) String name,
        @Size(max = 200) String query,
        @Size(max = 200) String city,
        @Size(max = 200) String broadLocation,
        @Size(max = 20) String roomType,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        LocalDate availableFrom,
        Boolean furnished,
        Boolean alertsEnabled) {}
