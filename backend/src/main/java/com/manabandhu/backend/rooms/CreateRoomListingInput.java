package com.manabandhu.backend.rooms;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateRoomListingInput(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 4000) String description,
        @Positive BigDecimal price,
        @NotBlank @Size(max = 50) String roomType,
        @Size(max = 200) String broadLocation,
        @Size(max = 4000) String exactAddress,
        @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
        @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude,
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

    public CreateRoomListingInput(String title, String description, BigDecimal price, String roomType,
                                  String broadLocation, String exactAddress, BigDecimal latitude, BigDecimal longitude) {
        this(title, description, price, roomType, broadLocation, exactAddress, latitude, longitude,
                "ANY", "ANY", "SHARED", false, BigDecimal.ZERO, BigDecimal.ZERO, "FLEXIBLE", false, false, null, null);
    }
}
