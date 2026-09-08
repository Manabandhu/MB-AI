package com.manabandhu.backend.post;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePostInput(
        UUID communityId,
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(max = 4000) String body) {}
