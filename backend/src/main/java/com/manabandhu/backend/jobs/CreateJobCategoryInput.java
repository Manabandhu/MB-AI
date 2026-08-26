package com.manabandhu.backend.jobs;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateJobCategoryInput(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 120) String slug) {}
