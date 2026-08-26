package com.manabandhu.backend.marketplace;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddListingImageInput(
        @NotBlank @Size(max = 500) String url,
        int sortOrder) {}
