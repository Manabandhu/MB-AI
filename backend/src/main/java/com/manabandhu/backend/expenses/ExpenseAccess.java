package com.manabandhu.backend.expenses;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

/** Group membership backed by {@code expense_group_members}; the owner always counts as a member. */
@Component
class ExpenseAccess {

    private final JdbcTemplate jdbcTemplate;
    private final ExpenseGroupRepository groupRepository;

    ExpenseAccess(JdbcTemplate jdbcTemplate, ExpenseGroupRepository groupRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.groupRepository = groupRepository;
    }

    ExpenseGroup requireGroup(UUID groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense group not found"));
    }

    boolean isMember(UUID groupId, UUID userId) {
        var count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM public.expense_group_members WHERE group_id = ? AND user_id = ?",
                Long.class, groupId, userId);
        return count != null && count > 0;
    }

    /** Fails with 404 for unknown groups and 403 for non-members; returns the group otherwise. */
    ExpenseGroup requireMember(Actor actor, UUID groupId) {
        var group = requireGroup(groupId);
        if (!actor.admin() && !actor.is(group.getOwnerId()) && !isMember(groupId, actor.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this expense group");
        }
        return group;
    }

    void addMember(UUID groupId, UUID userId) {
        jdbcTemplate.update("""
                INSERT INTO public.expense_group_members (group_id, user_id) VALUES (?, ?)
                ON CONFLICT (group_id, user_id) DO NOTHING
                """, groupId, userId);
    }

    void removeMember(UUID groupId, UUID userId) {
        jdbcTemplate.update("DELETE FROM public.expense_group_members WHERE group_id = ? AND user_id = ?", groupId, userId);
    }

    List<UUID> memberIds(UUID groupId) {
        return jdbcTemplate.queryForList(
                "SELECT user_id FROM public.expense_group_members WHERE group_id = ? ORDER BY joined_at", UUID.class, groupId);
    }

    List<UUID> groupIdsFor(UUID userId) {
        return jdbcTemplate.queryForList("""
                SELECT id FROM public.expense_groups WHERE owner_id = ?
                UNION
                SELECT group_id FROM public.expense_group_members WHERE user_id = ?
                """, UUID.class, userId, userId);
    }
}
