package com.manabandhu.backend.rooms;

import java.math.BigDecimal;

import jakarta.validation.constraints.Size;

public record UpdateRoomListingInput(
        @Size(max = 200) String title,
        @Size(max = 4000) String description,
        BigDecimal price,
        @Size(max = 20) String roomType,
        @Size(max = 200) String broadLocation,
        @Size(max = 4000) String exactAddress,
        BigDecimal latitude,
        BigDecimal longitude,
        @Size(max = 20) String status) {}
