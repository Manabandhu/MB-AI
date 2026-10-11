package com.manabandhu.backend.rooms;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record AddRoomImageInput(
        @NotBlank @Size(max = 500) String url,
        @PositiveOrZero @Max(100) int sortOrder) {}
