package com.manabandhu.backend.immigration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateFaqItemInput(
        @NotBlank @Size(max = 500) String question,
        @NotBlank @Size(max = 4000) String answer,
        @NotBlank @Size(max = 80) String category,
        @Size(max = 400) String tags,
        boolean published,
        int sortOrder) {}
