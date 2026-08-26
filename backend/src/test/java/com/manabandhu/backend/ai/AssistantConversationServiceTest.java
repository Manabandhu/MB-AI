package com.manabandhu.backend.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AssistantConversationServiceTest {

    @Mock
    AssistantConversationRepository repository;

    @InjectMocks
    AssistantConversationService service;

    @Test
    void findByUserReturnsOwned() {
        var userId = UUID.randomUUID();
        when(repository.findByUserIdOrderByUpdatedAtDesc(userId)).thenReturn(List.of());
        assertThat(service.findByUser(userId)).isEmpty();
        verify(repository).findByUserIdOrderByUpdatedAtDesc(userId);
    }

    @Test
    void touchUpdatesTimestamp() {
        var conversation = new AssistantConversation(UUID.randomUUID(), "Title");
        when(repository.findById(conversation.getId())).thenReturn(java.util.Optional.of(conversation));
        service.touch(conversation.getId());
        verify(repository).findById(conversation.getId());
    }
}
