package com.manabandhu.backend.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePostCommentInput(
        @NotBlank @Size(max = 4000) String body) {}
