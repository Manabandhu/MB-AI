package com.manabandhu.backend.marketplace;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.Size;

public record UpdateListingInput(
        UUID categoryId,
        @Size(max = 200) String title,
        @Size(max = 4000) String description,
        BigDecimal price,
        @Size(min = 3, max = 3) String currency,
        @Size(max = 20) String condition,
        @Size(max = 200) String location,
        Boolean negotiable,
        @Size(max = 20) String status) {}
