package com.manabandhu.backend.community;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePostReactionInput(
        @NotBlank @Size(max = 20) String type) {}
