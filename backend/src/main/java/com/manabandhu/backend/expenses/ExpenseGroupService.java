package com.manabandhu.backend.expenses;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

/** Expense groups are private to their members; only the owner can rename, delete, or manage members. */
@Service
public class ExpenseGroupService {

    private final ExpenseGroupRepository repository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseAccess access;
    private final ExpenseBalanceService balanceService;

    ExpenseGroupService(ExpenseGroupRepository repository, ExpenseRepository expenseRepository, ExpenseAccess access,
                        ExpenseBalanceService balanceService) {
        this.repository = repository;
        this.expenseRepository = expenseRepository;
        this.access = access;
        this.balanceService = balanceService;
    }

    @Transactional(readOnly = true)
    public List<ExpenseGroupView> listFor(Actor actor) {
        var ids = access.groupIdsFor(actor.id());
        if (ids.isEmpty()) return List.of();
        return repository.findAllById(ids).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::view)
                .toList();
    }

    @Transactional(readOnly = true)
    public ExpenseGroupView viewFor(Actor actor, UUID groupId) {
        return view(access.requireMember(actor, groupId));
    }

    @Transactional
    public ExpenseGroupView create(Actor actor, CreateExpenseGroupInput input) {
        var group = repository.saveAndFlush(new ExpenseGroup(actor.id(), input.name().trim(), input.description(),
                input.groupType() != null ? input.groupType() : "APARTMENT",
                input.currency() != null ? input.currency() : "USD"));
        access.addMember(group.getId(), actor.id());
        return view(group);
    }

    @Transactional
    public ExpenseGroupView update(Actor actor, UUID id, String name, String description) {
        var group = access.requireGroup(id);
        actor.requireOwner(group.getOwnerId(), "Only the group owner can edit this group");
        if (name != null && !name.isBlank()) group.name = name.trim();
        if (description != null) group.description = description;
        group.updatedAt = Instant.now();
        return view(repository.save(group));
    }

    @Transactional
    public void delete(Actor actor, UUID id) {
        var group = access.requireGroup(id);
        actor.requireOwner(group.getOwnerId(), "Only the group owner can delete this group");
        repository.delete(group);
    }

    @Transactional(readOnly = true)
    public List<UUID> members(Actor actor, UUID groupId) {
        access.requireMember(actor, groupId);
        return access.memberIds(groupId);
    }

    @Transactional
    public List<UUID> addMember(Actor actor, UUID groupId, UUID userId) {
        var group = access.requireGroup(groupId);
        actor.requireOwner(group.getOwnerId(), "Only the group owner can add members");
        if (!access.userExists(userId)) {
            // Expense splits reference auth.users, so a member id that matches no account would break every later expense.
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No ManaBandhu account has that member id");
        }
        access.addMember(groupId, userId);
        return access.memberIds(groupId);
    }

    /**
     * The owner can remove anyone except themselves; members can leave on their own. Anyone with an open balance in
     * the group must settle it first: once they are gone nobody could record the settlement (409).
     */
    @Transactional
    public void removeMember(Actor actor, UUID groupId, UUID userId) {
        var group = access.requireGroup(groupId);
        if (group.getOwnerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The owner cannot leave; delete the group instead");
        }
        actor.requireAnyOf("Only the owner or the member can remove this membership", group.getOwnerId(), userId);
        if (!balanceService.openBalancesOf(groupId, userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This member still owes or is owed money in this group. Settle up before they leave.");
        }
        access.removeMember(groupId, userId);
    }

    private ExpenseGroupView view(ExpenseGroup group) {
        var members = Math.max(1, access.memberIds(group.getId()).size());
        return ExpenseGroupView.of(group, members, expenseRepository.totalForGroup(group.getId()));
    }
}
