package com.manabandhu.backend.rooms;

import java.math.BigDecimal;

import jakarta.validation.constraints.Size;

public record UpdateRoomListingInput(
        @Size(max = 200) String title,
        @Size(max = 4000) String description,
        BigDecimal price,
        @Size(max = 50) String roomType,
        @Size(max = 200) String broadLocation,
        @Size(max = 4000) String exactAddress,
        BigDecimal latitude,
        BigDecimal longitude,
        @Size(max = 20) String status,
        String dietaryPreference,
        String genderPreference,
        String bathroomType,
        Boolean utilitiesIncluded,
        BigDecimal estUtilityMonthly,
        BigDecimal securityDeposit,
        String leaseTerm,
        Boolean isVerifiedHost,
        Boolean universityShuttleAccessible,
        String stateCode,
        String county) {

    public UpdateRoomListingInput(String title, String description, BigDecimal price, String roomType,
                                  String broadLocation, String exactAddress, BigDecimal latitude, BigDecimal longitude, String status) {
        this(title, description, price, roomType, broadLocation, exactAddress, latitude, longitude, status,
                null, null, null, null, null, null, null, null, null, null, null);
    }
}
