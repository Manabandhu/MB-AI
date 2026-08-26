package com.manabandhu.backend.rooms;

import jakarta.validation.constraints.Size;

public record CreateRoomBookingInput(
        @Size(max = 4000) String message) {}
