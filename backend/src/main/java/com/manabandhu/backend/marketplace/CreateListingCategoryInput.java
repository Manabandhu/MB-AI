package com.manabandhu.backend.marketplace;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateListingCategoryInput(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 120) String slug) {}
