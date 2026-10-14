package com.manabandhu.backend.rides;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

/**
 * A ride as the viewer may see it. Strangers get approximate coordinates (two decimals, about 1 km) and no driver
 * id, chat id, or route line; the driver, passengers, and admins (the ride's members) see everything.
 */
public record RideOfferView(
        UUID id,
        UUID driverId,
        boolean isDriver,
        boolean isMember,
        String originArea,
        String destinationArea,
        Double originLat,
        Double originLng,
        Double destinationLat,
        Double destinationLng,
        String routePolyline,
        BigDecimal distanceMiles,
        Integer estimatedDurationMins,
        String tollPreference,
        BigDecimal estimatedTollAmount,
        Boolean isRecurring,
        String recurrencePattern,
        String[] recurringDays,
        String luggageCapacity,
        String genderPreference,
        Instant completedAt,
        UUID conversationId,
        Instant chatExpiresAt,
        Instant departureAt,
        int seatsTotal,
        int seatsAvailable,
        String contribution,
        String status,
        Instant createdAt,
        Instant updatedAt) {

    static RideOfferView of(RideOffer offer, boolean isDriver, boolean isMember) {
        return new RideOfferView(
                offer.getId(),
                isMember ? offer.getDriverId() : null,
                isDriver,
                isMember,
                offer.getOriginArea(),
                offer.getDestinationArea(),
                isMember ? offer.getOriginLat() : approximate(offer.getOriginLat()),
                isMember ? offer.getOriginLng() : approximate(offer.getOriginLng()),
                isMember ? offer.getDestinationLat() : approximate(offer.getDestinationLat()),
                isMember ? offer.getDestinationLng() : approximate(offer.getDestinationLng()),
                isMember ? offer.getRoutePolyline() : null,
                offer.getDistanceMiles(),
                offer.getEstimatedDurationMins(),
                offer.getTollPreference(),
                offer.getEstimatedTollAmount(),
                offer.getIsRecurring(),
                offer.getRecurrencePattern(),
                offer.getRecurringDays(),
                offer.getLuggageCapacity(),
                offer.getGenderPreference(),
                offer.getCompletedAt(),
                isMember ? offer.getConversationId() : null,
                offer.getChatExpiresAt(),
                offer.getDepartureAt(),
                offer.getSeatsTotal(),
                offer.getSeatsAvailable(),
                offer.getContribution(),
                offer.getStatus(),
                offer.getCreatedAt(),
                offer.getUpdatedAt());
    }

    static Double approximate(Double coordinate) {
        return coordinate == null ? null : BigDecimal.valueOf(coordinate).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
