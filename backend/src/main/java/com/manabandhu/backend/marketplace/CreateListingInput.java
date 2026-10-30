package com.manabandhu.backend.marketplace;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CreateListingInput(
        @NotNull UUID categoryId,
        @NotBlank @Size(max = 200) String title,
        @Size(max = 4000) String description,
        @NotNull @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal price,
        @NotBlank @Pattern(regexp = MarketplaceRules.CURRENCY) String currency,
        @Pattern(regexp = MarketplaceRules.CONDITIONS) String condition,
        @Size(max = 200) String location,
        Boolean negotiable) {}
