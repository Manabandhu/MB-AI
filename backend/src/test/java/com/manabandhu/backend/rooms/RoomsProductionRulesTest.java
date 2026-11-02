package com.manabandhu.backend.rooms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.chat.ContactOwnerService;
import com.manabandhu.backend.chat.Conversation;
import com.manabandhu.backend.chat.ConversationParticipantService;
import com.manabandhu.backend.chat.ConversationService;
import com.manabandhu.backend.chat.MessageService;
import com.manabandhu.backend.common.audit.AdminAuditService;
import com.manabandhu.backend.media.StorageUrls;
import com.manabandhu.backend.notifications.NotificationPublisher;

/** Rules added in the rooms production pass: status transitions, visibility, caps, moderation and inquiries. */
class RoomsProductionRulesTest {

    private final UUID ownerId = UUID.randomUUID();
    private final UUID guestId = UUID.randomUUID();
    private final UUID listingId = UUID.randomUUID();
    private final Actor owner = new Actor(ownerId, false, false);
    private final Actor guest = new Actor(guestId, false, false);
    private final Actor admin = new Actor(UUID.randomUUID(), true, false);

    private final RoomListingRepository listingRepository = mock(RoomListingRepository.class);
    private final RoomAmenityRepository amenityRepository = mock(RoomAmenityRepository.class);
    private final AdminAuditService audit = mock(AdminAuditService.class);
    private final RoomListingService listingService = new RoomListingService(listingRepository, amenityRepository,
            mock(RoomPreferenceRepository.class), audit);

    private RoomListing listing(String status) {
        var listing = new RoomListing(ownerId, "Room", null, BigDecimal.valueOf(800),
                "Private Room", status, "Irving", "1 Main St", null, null);
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        return listing;
    }

    private static HttpStatus status(Throwable error) {
        return (HttpStatus) ((ResponseStatusException) error).getStatusCode();
    }

    // --- bookings ---------------------------------------------------------------------------------------------

    private final RoomBookingRepository bookingRepository = mock(RoomBookingRepository.class);
    private final RoomBookingService bookingService = new RoomBookingService(bookingRepository, listingRepository);

    private UUID booking(String status) {
        listing("active");
        var id = UUID.randomUUID();
        when(bookingRepository.findByIdForUpdate(id))
                .thenReturn(Optional.of(new RoomBooking(listingId, guestId, status, "Hi")));
        when(bookingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        return id;
    }

    @Test
    void cancelledAndRejectedBookingsAreFinal() {
        var cancelled = booking("cancelled");
        assertThatThrownBy(() -> bookingService.updateStatus(owner, cancelled, "accepted"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
        var rejected = booking("rejected");
        assertThatThrownBy(() -> bookingService.updateStatus(guest, rejected, "pending"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void acceptedBookingCanStillBeCancelledByTheGuest() {
        var accepted = booking("accepted");
        assertThat(bookingService.updateStatus(guest, accepted, "cancelled").getStatus()).isEqualTo("cancelled");
    }

    @Test
    void missingOrUnknownBookingStatusIsABadRequest() {
        assertThatThrownBy(() -> bookingService.updateStatus(guest, UUID.randomUUID(), null))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThatThrownBy(() -> bookingService.updateStatus(guest, UUID.randomUUID(), "approved"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    // --- listing status ---------------------------------------------------------------------------------------

    @Test
    void ownerCanMarkRentedAndRelist() {
        listingService.validateTransition("active", "rented", false);
        listingService.validateTransition("paused", "rented", false);
        listingService.validateTransition("rented", "active", false);
        assertThatThrownBy(() -> listingService.validateTransition("draft", "rented", false))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void publishIsTheOwnersDecisionOnly() {
        listing("draft");
        assertThatThrownBy(() -> listingService.setOwnerOnlyStatus(admin, listingId, "active"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> listingService.setOwnerOnlyStatus(guest, listingId, "active"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void draftListingsAreInvisibleToEveryoneButTheOwnerAndAdmins() {
        listing("draft");
        assertThatThrownBy(() -> listingService.requireVisible(listingId, guest))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.NOT_FOUND));
        assertThatThrownBy(() -> listingService.requireVisible(listingId, null))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.NOT_FOUND));
        assertThat(listingService.requireVisible(listingId, owner)).isNotNull();
        assertThat(listingService.requireVisible(listingId, admin)).isNotNull();
    }

    @Test
    void amenitiesAreReplacedAndDeduplicated() {
        var listing = listing("draft");
        when(listingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var input = new UpdateRoomListingInput(null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null, List.of("WiFi", " WiFi ", "Parking"));
        listingService.update(owner, listingId, input);
        verify(amenityRepository).deleteByListingId(listing.getId());
        verify(amenityRepository, org.mockito.Mockito.times(2)).save(any(RoomAmenity.class));
    }

    // --- images -----------------------------------------------------------------------------------------------

    @Test
    void imagesAreCappedPerListing() {
        listing("active");
        var images = mock(RoomImageRepository.class);
        when(images.countByListingId(listingId)).thenReturn((long) RoomImageService.MAX_IMAGES);
        var service = new RoomImageService(images, listingService, mock(StorageUrls.class));
        assertThatThrownBy(() -> service.add(owner, listingId, "https://x/storage/v1/object/public/rooms/a.jpg", 0))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
        verify(images, never()).save(any());
    }

    @Test
    void strangersCannotAddImages() {
        listing("active");
        var service = new RoomImageService(mock(RoomImageRepository.class), listingService, mock(StorageUrls.class));
        assertThatThrownBy(() -> service.add(guest, listingId, "https://x/a.jpg", 0))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
    }

    // --- reports ----------------------------------------------------------------------------------------------

    private final RoomReportRepository reportRepository = mock(RoomReportRepository.class);
    private final RoomReportService reportService = new RoomReportService(reportRepository, listingService, audit);

    @Test
    void moderationIsAdminOnlyAndAudited() {
        listing("active");
        when(listingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        assertThatThrownBy(() -> listingService.moderate(owner, listingId, "rejected"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        verify(audit, never()).record(any(), any(), any(), any());

        listingService.moderate(admin, listingId, "rejected");
        verify(audit).record(admin.id().toString(), "room.moderate", "ROOM_LISTING", listingId.toString());
    }

    @Test
    void reportReviewIsAdminOnlyAndAudited() {
        var reportId = UUID.randomUUID();
        when(reportRepository.findById(reportId))
                .thenReturn(Optional.of(new RoomReport(listingId, guestId, "spam", null)));
        when(reportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        assertThatThrownBy(() -> reportService.review(guest, reportId, "resolved", "ok"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        verify(audit, never()).record(any(), any(), any(), any());

        reportService.review(admin, reportId, "resolved", "ok");
        verify(audit).record(admin.id().toString(), "room_report.review", "ROOM_REPORT", reportId.toString());
    }

    @Test
    void reviewQueueIsForModeratorsOnly() {
        assertThatThrownBy(() -> reportService.findReviewQueue(guest, null))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        verify(reportRepository, never()).findByStatusOrderByCreatedAtDesc(any(), any());
        assertThatThrownBy(() -> reportService.findReviewQueue(admin, "bogus"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void ownersCannotReportTheirOwnListingAndDraftsCannotBeReported() {
        listing("active");
        assertThatThrownBy(() -> reportService.create(owner, listingId, new CreateReportInput("spam", null)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.BAD_REQUEST));
        listing("draft");
        assertThatThrownBy(() -> reportService.create(guest, listingId, new CreateReportInput("spam", null)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.NOT_FOUND));
    }

    // --- inquiries --------------------------------------------------------------------------------------------

    private final RoomInquiryRepository inquiryRepository = mock(RoomInquiryRepository.class);
    private final ConversationService conversationService = mock(ConversationService.class);
    private final ConversationParticipantService participants = mock(ConversationParticipantService.class);
    private final MessageService messages = mock(MessageService.class);
    private final NotificationPublisher notifications = mock(NotificationPublisher.class);
    private final RoomInquiryService inquiryService = new RoomInquiryService(listingService, inquiryRepository,
            participants, messages, new ContactOwnerService(conversationService, participants, messages, notifications));

    private RoomInquiryInput inquiryInput() {
        return new RoomInquiryInput(LocalDate.now().plusDays(3), null, null, "Hello");
    }

    @Test
    void pausedListingsDoNotTakeInquiries() {
        listing("paused");
        assertThatThrownBy(() -> inquiryService.inquire(guest, listingId, inquiryInput()))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
        verify(conversationService, never()).create(any(), any(), any());
    }

    @Test
    void repeatInquiryReusesTheExistingChatWithoutANewNotification() {
        listing("active");
        var conversationId = UUID.randomUUID();
        var previous = new RoomInquiry(listingId, guestId, ownerId, conversationId, LocalDate.now(), 6, null, "Hi");
        when(inquiryRepository.findFirstByRoomIdAndSenderIdOrderByCreatedAtDesc(listingId, guestId))
                .thenReturn(Optional.of(previous));
        when(participants.isParticipant(conversationId, guestId)).thenReturn(true);
        when(participants.isParticipant(conversationId, ownerId)).thenReturn(true);

        var response = inquiryService.inquire(guest, listingId, inquiryInput());

        assertThat(response.conversationId()).isEqualTo(conversationId);
        verify(messages).send(eq(conversationId), eq(guestId), any(), any());
        verify(conversationService, never()).create(any(), any(Conversation.ConversationType.class), any());
        verify(notifications, never()).publish(any(), any(), any(), any(), any(), any());
    }

    // --- validation -------------------------------------------------------------------------------------------

    private final jakarta.validation.Validator validator =
            jakarta.validation.Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void createInputRejectsMissingPriceUnknownEnumsAndNegativeDeposits() {
        var input = new CreateRoomListingInput("Room", null, null, "Private Room", "Irving", null, null, null,
                "CARNIVORE", "ANY", "SHARED", false, BigDecimal.ZERO, new BigDecimal("-1"), "FLEXIBLE", false,
                null, null, null);
        var fields = validator.validate(input).stream().map(v -> v.getPropertyPath().toString()).toList();
        assertThat(fields).contains("price", "dietaryPreference", "securityDeposit");
    }

    @Test
    void inquiryRejectsZeroMonths() {
        var input = new RoomInquiryInput(LocalDate.now(), 0, null, "Hi");
        var fields = validator.validate(input).stream().map(v -> v.getPropertyPath().toString()).toList();
        assertThat(fields).contains("stayDurationMonths");
    }

    @Test
    void moveInIsCheckedAgainstTheGuestsLocalDayNotTheServers() {
        listing("active");
        // "Today" for a guest in the Americas can be yesterday in UTC; that must still be accepted.
        var yesterdayUtc = LocalDate.now(java.time.ZoneOffset.UTC).minusDays(1);
        var conversation = mock(Conversation.class);
        when(conversation.getId()).thenReturn(UUID.randomUUID());
        when(conversationService.create(any(), any(), any())).thenReturn(conversation);
        when(inquiryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var accepted = new RoomInquiryInput(LocalDate.now(java.time.ZoneOffset.ofHours(-12)), null, null, "Hi");
        assertThat(inquiryService.inquire(guest, listingId, accepted)).isNotNull();
        var stale = new RoomInquiryInput(yesterdayUtc.minusDays(2), null, null, "Hi");
        assertThatThrownBy(() -> inquiryService.inquire(guest, listingId, stale))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.BAD_REQUEST));
    }
}
