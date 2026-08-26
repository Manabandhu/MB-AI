package com.manabandhu.backend.safety;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BlockedUserService {

    private final BlockedUserRepository repository;

    BlockedUserService(BlockedUserRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<BlockedUser> findByOwner(UUID ownerId) {
        return repository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    @Transactional(readOnly = true)
    public boolean isBlocked(UUID ownerId, UUID blockedUserId) {
        return repository.existsByOwnerIdAndBlockedUserId(ownerId, blockedUserId);
    }

    @Transactional
    public BlockedUser block(UUID ownerId, UUID blockedUserId, String reason) {
        return repository.save(new BlockedUser(ownerId, blockedUserId, reason));
    }

    @Transactional
    public void unblock(UUID ownerId, UUID blockedUserId) {
        repository.findByOwnerIdAndBlockedUserId(ownerId, blockedUserId).ifPresent(repository::delete);
    }
}
