package com.manabandhu.backend.chat;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.common.audit.AdminAuditService;

class ConversationAdminAuditTest {

    private final ConversationParticipantRepository repository = mock(ConversationParticipantRepository.class);
    private final AdminAuditService audit = mock(AdminAuditService.class);
    private final ConversationParticipantService service = new ConversationParticipantService(repository, audit);
    private final UUID conversationId = UUID.randomUUID();

    @Test
    void adminReadingSomeoneElsesChatIsAudited() {
        var admin = new Actor(UUID.randomUUID(), true, false);
        when(repository.findByConversationIdAndUserId(conversationId, admin.id())).thenReturn(Optional.empty());

        service.requireParticipant(admin, conversationId);

        verify(audit).record(admin.id().toString(), "chat.admin_access", "CONVERSATION", conversationId.toString());
    }

    @Test
    void strangersAreRejectedWithoutAnAuditRow() {
        var stranger = new Actor(UUID.randomUUID(), false, false);
        when(repository.findByConversationIdAndUserId(any(), any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.requireParticipant(stranger, conversationId))
                .isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(audit);
    }
}
