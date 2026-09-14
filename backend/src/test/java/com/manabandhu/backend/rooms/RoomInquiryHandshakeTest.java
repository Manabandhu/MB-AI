package com.manabandhu.backend.rooms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import com.manabandhu.backend.chat.Conversation;
import com.manabandhu.backend.chat.ConversationParticipant;
import com.manabandhu.backend.chat.ConversationParticipantService;
import com.manabandhu.backend.chat.ConversationService;
import com.manabandhu.backend.chat.Message;
import com.manabandhu.backend.chat.MessageService;

class RoomInquiryHandshakeTest {

    private RoomListingService listingService;
    private RoomInquiryRepository inquiryRepository;
    private ConversationService conversationService;
    private ConversationParticipantService participantService;
    private MessageService messageService;
    private RoomsController controller;

    @BeforeEach
    void setUp() {
        listingService = mock(RoomListingService.class);
        inquiryRepository = mock(RoomInquiryRepository.class);
        conversationService = mock(ConversationService.class);
        participantService = mock(ConversationParticipantService.class);
        messageService = mock(MessageService.class);

        controller = new RoomsController(
                mock(RoomsContentService.class),
                listingService,
                mock(RoomAvailabilityService.class),
                mock(RoomBookingService.class),
                mock(RoomImageService.class),
                mock(RoomFavoriteService.class),
                mock(RoomSavedSearchService.class),
                mock(RoomReportService.class),
                mock(RoomAnalyticsService.class),
                inquiryRepository,
                conversationService,
                participantService,
                messageService
        );
    }

    @Test
    void inquireRoomCreatesChatAndInquiry() {
        var roomId = UUID.randomUUID();
        var hostId = UUID.randomUUID();
        var senderId = UUID.randomUUID();

        var auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(senderId.toString());

        var listing = new RoomListing(hostId, "Sunny Room", "Desc", BigDecimal.valueOf(800), "PRIVATE", "active", "Austin", null, null, null);
        when(listingService.findById(roomId)).thenReturn(Optional.of(listing));

        var conversation = mock(Conversation.class);
        var convId = UUID.randomUUID();
        when(conversation.getId()).thenReturn(convId);
        when(conversationService.create(eq(senderId), eq(Conversation.ConversationType.ROOM_INQUIRY), any()))
                .thenReturn(conversation);

        var message = mock(Message.class);
        when(messageService.send(eq(convId), eq(senderId), any(), any())).thenReturn(message);

        when(inquiryRepository.save(any(RoomInquiry.class))).thenAnswer(inv -> inv.getArgument(0));

        var input = new RoomInquiryInput(
                LocalDate.now().plusDays(7),
                6,
                "PURE_VEG",
                "Hi, I am interested in this room!"
        );

        var response = controller.inquire(auth, roomId, input);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        var body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.conversationId()).isEqualTo(convId);

        verify(participantService).add(convId, hostId, ConversationParticipant.ParticipantRole.MEMBER);
        verify(inquiryRepository).save(any(RoomInquiry.class));
    }
}
