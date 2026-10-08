package com.manabandhu.backend.expenses;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

/** Payments between group members. Only the two parties (or an admin) can see or change a settlement. */
@Service
public class SettlementService {

    private final SettlementRepository repository;
    private final ExpenseAccess access;

    SettlementService(SettlementRepository repository, ExpenseAccess access) {
        this.repository = repository;
        this.access = access;
    }

    @Transactional(readOnly = true)
    public List<Settlement> listFor(Actor actor) {
        return repository.findByFromUserIdOrToUserIdOrderByCreatedAtDesc(actor.id(), actor.id());
    }

    @Transactional(readOnly = true)
    public List<Settlement> listForGroup(Actor actor, UUID groupId) {
        access.requireMember(actor, groupId);
        return repository.findByGroupIdOrderByCreatedAtDesc(groupId);
    }

    @Transactional(readOnly = true)
    public Settlement requireVisible(Actor actor, UUID settlementId) {
        var settlement = requireSettlement(settlementId);
        actor.requireAnyOf("Not authorized to view this settlement", settlement.getFromUserId(), settlement.getToUserId());
        return settlement;
    }

    @Transactional
    public Settlement create(Actor actor, UUID groupId, CreateSettlementInput input) {
        var group = access.requireMember(actor, groupId);
        var fromUserId = input.fromUserId() != null ? input.fromUserId() : actor.id();
        if (fromUserId.equals(input.toUserId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A settlement needs two different people");
        }
        if (!actor.admin() && !actor.is(fromUserId) && !actor.is(input.toUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only record payments you made or received");
        }
        for (var party : List.of(fromUserId, input.toUserId())) {
            if (!party.equals(group.getOwnerId()) && !access.isMember(groupId, party)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Both people must be members of the group");
            }
        }
        var status = input.status() != null ? input.status() : "completed";
        var settledAt = "completed".equals(status) ? (input.settledAt() != null ? input.settledAt() : Instant.now()) : null;
        var currency = input.currency() != null ? input.currency() : group.getCurrency() != null ? group.getCurrency() : "USD";
        return repository.save(new Settlement(groupId, fromUserId, input.toUserId(), input.amount(), currency, status, settledAt));
    }

    @Transactional
    public Settlement updateStatus(Actor actor, UUID settlementId, String status, Instant settledAt) {
        var settlement = requireSettlement(settlementId);
        actor.requireAnyOf("Not authorized to update this settlement", settlement.getFromUserId(), settlement.getToUserId());
        settlement.status = status;
        settlement.settledAt = "completed".equals(status) ? (settledAt != null ? settledAt : Instant.now()) : settledAt;
        return repository.save(settlement);
    }

    private Settlement requireSettlement(UUID settlementId) {
        return repository.findById(settlementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Settlement not found"));
    }
}
