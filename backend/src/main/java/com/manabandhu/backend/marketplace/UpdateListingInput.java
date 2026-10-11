package com.manabandhu.backend.marketplace;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** Partial update; {@code null} leaves a field unchanged and {@code ""} clears an optional text field. */
public record UpdateListingInput(
        UUID categoryId,
        @Size(max = 200) @Pattern(regexp = MarketplaceRules.NOT_BLANK) String title,
        @Size(max = 4000) String description,
        @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal price,
        @Pattern(regexp = MarketplaceRules.CURRENCY) String currency,
        @Pattern(regexp = MarketplaceRules.CONDITIONS + "|") String condition,
        @Size(max = 200) String location,
        Boolean negotiable,
        @Pattern(regexp = "active|reserved|sold|removed") String status) {}
