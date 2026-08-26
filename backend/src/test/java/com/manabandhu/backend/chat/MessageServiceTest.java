package com.manabandhu.backend.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    MessageRepository repository;

    @Mock
    ConversationService conversationService;

    @InjectMocks
    MessageService service;

    @Test
    void sendPersistsMessage() {
        var conversationId = UUID.randomUUID();
        var senderId = UUID.randomUUID();
        when(repository.save(org.mockito.ArgumentMatchers.any())).thenAnswer(inv -> inv.getArgument(0));
        var message = service.send(conversationId, senderId, "Hello", Message.MessageType.TEXT);
        assertThat(message.getSenderId()).isEqualTo(senderId);
        assertThat(message.getBody()).isEqualTo("Hello");
        verify(conversationService).updateLastMessageAt(org.mockito.ArgumentMatchers.eq(conversationId), org.mockito.ArgumentMatchers.any(java.time.Instant.class));
    }
}
