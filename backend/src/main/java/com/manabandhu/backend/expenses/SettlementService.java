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

    static final String PENDING = "pending";
    static final String COMPLETED = "completed";
    static final String CANCELLED = "cancelled";

    /**
     * Records a payment. Only the recipient (or an admin) can mark money as received, so a payer's record is
     * always {@code pending} until the recipient confirms it; that stops a debtor from clearing a debt alone.
     */
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
        var canConfirm = actor.admin() || actor.is(input.toUserId());
        var requested = input.status() == null ? (canConfirm ? COMPLETED : PENDING) : input.status();
        var status = COMPLETED.equals(requested) && canConfirm ? COMPLETED : PENDING;
        if (PENDING.equals(status)
                && repository.existsByGroupIdAndFromUserIdAndToUserIdAndStatus(groupId, fromUserId, input.toUserId(), PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A payment between these members is already waiting for confirmation");
        }
        var settledAt = COMPLETED.equals(status) ? Instant.now() : null;
        var currency = ExpenseAccess.groupCurrency(group, input.currency());
        return repository.save(new Settlement(groupId, fromUserId, input.toUserId(), input.amount(), currency, status, settledAt));
    }

    /**
     * Transitions on a row-locked settlement: {@code pending → completed} by the recipient or an admin,
     * {@code pending → cancelled} by either party. Completed and cancelled are final.
     */
    @Transactional
    public Settlement updateStatus(Actor actor, UUID settlementId, String rawStatus) {
        var status = rawStatus == null ? "" : rawStatus.trim().toLowerCase(java.util.Locale.ROOT);
        var settlement = repository.findByIdForUpdate(settlementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Settlement not found"));
        actor.requireAnyOf("Not authorized to update this settlement", settlement.getFromUserId(), settlement.getToUserId());
        var current = settlement.getStatus() == null ? PENDING : settlement.getStatus().toLowerCase(java.util.Locale.ROOT);
        if (status.equals(current)) {
            return settlement;
        }
        if (!PENDING.equals(current) || PENDING.equals(status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A " + current + " settlement cannot become " + status);
        }
        if (COMPLETED.equals(status)) {
            actor.requireAnyOf("Only the person who received the payment can confirm it", settlement.getToUserId());
            settlement.settledAt = Instant.now();
        } else if (!CANCELLED.equals(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be completed or cancelled");
        }
        settlement.status = status;
        return repository.save(settlement);
    }

    private Settlement requireSettlement(UUID settlementId) {
        return repository.findById(settlementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Settlement not found"));
    }
}
