package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.manabandhu.backend.chat.ConversationParticipantService;
import com.manabandhu.backend.notifications.Notification;
import com.manabandhu.backend.notifications.NotificationPublisher;

/**
 * Keeps seats, participant rows and ride-chat membership consistent when a rider leaves a ride or the driver cancels
 * it. Callers hold the offer row lock.
 */
@Component
class RideMembership {

    private final RideBookingRepository bookingRepository;
    private final RideRequestRepository requestRepository;
    private final RideParticipantRepository participantRepository;
    private final ConversationParticipantService chatParticipants;
    private final NotificationPublisher notifications;

    RideMembership(RideBookingRepository bookingRepository, RideRequestRepository requestRepository,
                   RideParticipantRepository participantRepository, ConversationParticipantService chatParticipants,
                   NotificationPublisher notifications) {
        this.bookingRepository = bookingRepository;
        this.requestRepository = requestRepository;
        this.participantRepository = participantRepository;
        this.chatParticipants = chatParticipants;
        this.notifications = notifications;
    }

    /** Seats held by riders: live bookings plus accepted requests. Seats the driver blocked are not counted. */
    int heldSeats(UUID rideId) {
        return (int) (bookingRepository.sumLiveSeats(rideId) + requestRepository.sumAcceptedSeats(rideId));
    }

    /**
     * Drops the rider's participant row and ride-chat access unless they still hold a live booking or an accepted
     * request on this ride.
     */
    void leaveIfNoSeat(RideOffer offer, UUID userId) {
        if (userId.equals(offer.getDriverId())) return;
        var stillRiding = bookingRepository.existsByRideIdAndUserIdAndStatusNot(offer.getId(), userId,
                RideBookingService.CANCELLED)
                || requestRepository.existsByRideIdAndRiderIdAndStatus(offer.getId(), userId, RideRequestService.ACCEPTED);
        if (stillRiding) return;
        participantRepository.deleteByRideIdAndUserId(offer.getId(), userId);
        if (offer.getConversationId() != null && chatParticipants.isParticipant(offer.getConversationId(), userId)) {
            chatParticipants.leave(offer.getConversationId(), userId);
        }
    }

    /**
     * The driver cancelled or deleted the ride: cancel live bookings, decline open and accepted requests, remove
     * riders from the participants and the chat, and tell each of them.
     */
    void releaseEveryone(RideOffer offer, UUID actorId, String why) {
        var riders = new LinkedHashSet<UUID>();
        for (var booking : bookingRepository.findByRideIdOrderByCreatedAtDesc(offer.getId())) {
            if (!RideBookingService.CANCELLED.equalsIgnoreCase(booking.getStatus())) {
                booking.setStatus(RideBookingService.CANCELLED);
                bookingRepository.save(booking);
                riders.add(booking.getUserId());
            }
        }
        for (var request : requestRepository.findByRideIdOrderByCreatedAtDesc(offer.getId())) {
            var status = request.getStatus() == null ? "" : request.getStatus().toLowerCase(java.util.Locale.ROOT);
            if (RideRequestService.PENDING.equals(status) || RideRequestService.ACCEPTED.equals(status)) {
                request.setStatus(RideRequestService.REJECTED);
                requestRepository.save(request);
                riders.add(request.getRiderId());
            }
        }
        for (var participant : participantRepository.findByRideIdOrderByJoinedAtAsc(offer.getId())) {
            if (!participant.getUserId().equals(offer.getDriverId())) riders.add(participant.getUserId());
        }
        riders.remove(offer.getDriverId());
        offer.setSeatsAvailable(offer.getSeatsTotal());
        offer.setUpdatedAt(Instant.now());
        riders.forEach(rider -> leaveIfNoSeat(offer, rider));
        notifications.publishAll(riders, actorId, Notification.NotificationType.RIDE, "Ride cancelled",
                "The driver " + why + " the ride to " + offer.getDestinationArea() + ". Your seat was released.",
                "/rides");
    }
}
