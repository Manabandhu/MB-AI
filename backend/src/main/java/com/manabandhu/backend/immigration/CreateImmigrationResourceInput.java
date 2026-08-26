package com.manabandhu.backend.immigration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateImmigrationResourceInput(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 4000) String description,
        @NotBlank @Size(max = 80) String category,
        @Size(max = 500) String url,
        @NotBlank String resourceType,
        @Size(max = 400) String tags,
        boolean verified) {}
