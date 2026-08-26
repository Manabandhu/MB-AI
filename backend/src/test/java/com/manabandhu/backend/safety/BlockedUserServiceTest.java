package com.manabandhu.backend.safety;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BlockedUserServiceTest {

    @Mock
    BlockedUserRepository repository;

    @InjectMocks
    BlockedUserService service;

    @Test
    void isBlockedReturnsTrueWhenExists() {
        when(repository.existsByOwnerIdAndBlockedUserId(org.mockito.ArgumentMatchers.any(UUID.class), org.mockito.ArgumentMatchers.any(UUID.class))).thenReturn(true);
        assertThat(service.isBlocked(UUID.randomUUID(), UUID.randomUUID())).isTrue();
    }

    @Test
    void unblockDeletesEntry() {
        var ownerId = UUID.randomUUID();
        var blockedUserId = UUID.randomUUID();
        when(repository.findByOwnerIdAndBlockedUserId(ownerId, blockedUserId)).thenReturn(Optional.of(new BlockedUser(ownerId, blockedUserId, "reason")));
        service.unblock(ownerId, blockedUserId);
        verify(repository).delete(org.mockito.ArgumentMatchers.any());
    }
}
