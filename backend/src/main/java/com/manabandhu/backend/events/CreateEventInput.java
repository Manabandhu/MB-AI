package com.manabandhu.backend.events;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Future;

public record CreateEventInput(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 4000) String description,
        @NotBlank @Size(max = 200) String location,
        BigDecimal latitude,
        BigDecimal longitude,
        @NotBlank @Future String startAt,
        @NotBlank @Future String endAt,
        @NotNull UUID categoryId) {}
