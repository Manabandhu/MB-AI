package com.manabandhu.backend.marketplace;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateListingInput(
        @NotNull UUID categoryId,
        @NotBlank @Size(max = 200) String title,
        @Size(max = 4000) String description,
        @Positive @Digits(integer = 8, fraction = 2) BigDecimal price,
        @NotBlank @Size(min = 3, max = 3) String currency,
        @Size(max = 20) String condition,
        @Size(max = 200) String location,
        Boolean negotiable) {}
