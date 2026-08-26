package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
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

    @Transactional
    public Settlement create(UUID groupId, UUID fromUserId, UUID toUserId, BigDecimal amount, String currency, String status, Instant settledAt) {
        return repository.save(new Settlement(groupId, fromUserId, toUserId, amount, currency, status, settledAt));
    }
}
