package com.manabandhu.backend.rooms;

import java.util.UUID;

public record RoomInquiryResponse(
        UUID inquiryId,
        UUID conversationId) {}
