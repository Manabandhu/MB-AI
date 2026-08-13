package com.manabandhu.backend.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePostInput(
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(max = 4000) String body) {}
