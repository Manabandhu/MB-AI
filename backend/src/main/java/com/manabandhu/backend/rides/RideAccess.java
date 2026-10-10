package com.manabandhu.backend.rides;

import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

/**
 * Who may see or act on a ride. The driver owns the offer; passengers are users with a live booking,
 * an accepted request, or a participant row. Admins pass every check.
 */
@Component
class RideAccess {

    private final RideOfferRepository offerRepository;
    private final RideBookingRepository bookingRepository;
    private final RideRequestRepository requestRepository;
    private final RideParticipantRepository participantRepository;

    RideAccess(RideOfferRepository offerRepository, RideBookingRepository bookingRepository,
               RideRequestRepository requestRepository, RideParticipantRepository participantRepository) {
        this.offerRepository = offerRepository;
        this.bookingRepository = bookingRepository;
        this.requestRepository = requestRepository;
        this.participantRepository = participantRepository;
    }

    RideOffer requireOffer(UUID rideId) {
        return offerRepository.findById(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
    }

    boolean canManage(Actor actor, RideOffer offer) {
        return actor.admin() || actor.is(offer.getDriverId());
    }

    void requireDriver(Actor actor, RideOffer offer) {
        if (!canManage(actor, offer)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the driver can do this");
        }
    }

    boolean isPassenger(UUID userId, UUID rideId) {
        return bookingRepository.existsByRideIdAndUserIdAndStatusNot(rideId, userId, RideBookingService.CANCELLED)
                || requestRepository.existsByRideIdAndRiderIdAndStatus(rideId, userId, "accepted")
                || participantRepository.existsByRideIdAndUserId(rideId, userId);
    }

    /**
     * Women-only ({@code FEMALE_ONLY}) and men-only ({@code MALE_ONLY}) rides accept only riders whose gender is
     * verified in the token's {@code app_metadata}; self-declared profile data never counts. Any other preference
     * is open to everyone.
     */
    void requireEligibleRider(Actor actor, RideOffer offer) {
        var preference = offer.getGenderPreference() == null ? "" : offer.getGenderPreference().trim().toUpperCase(Locale.ROOT);
        var required = switch (preference) {
            case "FEMALE_ONLY", "WOMEN_ONLY" -> "female";
            case "MALE_ONLY", "MEN_ONLY" -> "male";
            default -> null;
        };
        if (required != null && !required.equals(actor.verifiedGender())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "female".equals(required)
                            ? "This ride is for verified women riders only"
                            : "This ride is for verified men riders only");
        }
    }

    boolean hasAcceptedRequest(UUID userId, UUID rideId) {
        return requestRepository.existsByRideIdAndRiderIdAndStatus(rideId, userId, RideRequestService.ACCEPTED);
    }

    /** Driver, confirmed passengers, and admins form the ride's private circle. */
    void requireMember(Actor actor, RideOffer offer) {
        if (!canManage(actor, offer) && !isPassenger(actor.id(), offer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the driver and passengers can do this");
        }
    }
}
