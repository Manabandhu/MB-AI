package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettlementService {

    private final SettlementRepository repository;

    SettlementService(SettlementRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Settlement> findByGroupId(UUID groupId) {
        return repository.findByGroupIdOrderByCreatedAtDesc(groupId);
    }

    @Transactional(readOnly = true)
    public List<Settlement> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Settlement> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public Settlement create(UUID groupId, UUID fromUserId, UUID toUserId, BigDecimal amount, String currency, String status, Instant settledAt) {
        return repository.save(new Settlement(groupId, fromUserId, toUserId, amount, currency, status, settledAt));
    }

    @Transactional
    public Settlement updateStatus(UUID settlementId, String status, Instant settledAt) {
        var settlement = repository.findById(settlementId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Settlement not found"));
        if (status != null) settlement.status = status;
        if (settledAt != null) settlement.settledAt = settledAt;
        return repository.save(settlement);
    }
}
