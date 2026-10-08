package com.manabandhu.backend.rooms;

import java.math.BigDecimal;

/** Optional filters for the public listings search. */
public record RoomSearchCriteria(
        String location,
        String roomType,
        String stateCode,
        String dietaryPreference,
        String genderPreference,
        BigDecimal minRent,
        BigDecimal maxRent,
        String bathroomType,
        BigDecimal lat,
        BigDecimal lng,
        Double radiusMiles) {}
