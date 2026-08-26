package com.manabandhu.backend.rooms;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateRoomListingInput(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 4000) String description,
        @NotBlank BigDecimal price,
        @NotBlank @Size(max = 20) String roomType,
        @Size(max = 200) String broadLocation,
        @Size(max = 4000) String exactAddress,
        BigDecimal latitude,
        BigDecimal longitude) {}
