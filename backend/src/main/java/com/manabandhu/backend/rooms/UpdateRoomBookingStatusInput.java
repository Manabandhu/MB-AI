package com.manabandhu.backend.rooms;

import jakarta.validation.constraints.Size;

public record UpdateRoomBookingStatusInput(
        @Size(max = 20) String status) {}
