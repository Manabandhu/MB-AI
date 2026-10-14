package com.manabandhu.backend.expenses;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class ExpenseGroupServiceTest {

    private final ExpenseGroupRepository repository = mock(ExpenseGroupRepository.class);
    private final ExpenseRepository expenseRepository = mock(ExpenseRepository.class);
    private final ExpenseAccess access = mock(ExpenseAccess.class);
    private final ExpenseBalanceService balances = mock(ExpenseBalanceService.class);
    private final ExpenseGroupService service = new ExpenseGroupService(repository, expenseRepository, access, balances);
    private final UUID groupId = UUID.randomUUID();
    private final UUID ownerId = UUID.randomUUID();
    private final UUID memberId = UUID.randomUUID();
    private final Actor owner = new Actor(ownerId, false, false);
    private final Actor member = new Actor(memberId, false, false);

    @BeforeEach
    void setUp() {
        var group = mock(ExpenseGroup.class);
        lenient().when(group.getId()).thenReturn(groupId);
        lenient().when(group.getOwnerId()).thenReturn(ownerId);
        lenient().when(access.requireGroup(groupId)).thenReturn(group);
        lenient().when(access.memberIds(groupId)).thenReturn(List.of(ownerId, memberId));
        lenient().when(balances.openBalancesOf(any(), any())).thenReturn(List.of());
    }

    private static HttpStatus status(Throwable error) {
        return HttpStatus.valueOf(((ResponseStatusException) error).getStatusCode().value());
    }

    @Test
    void addingAnIdWithNoAccountIsRejected() {
        var unknown = UUID.randomUUID();
        when(access.userExists(unknown)).thenReturn(false);

        assertThatThrownBy(() -> service.addMember(owner, groupId, unknown))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.NOT_FOUND));
        verify(access, never()).addMember(any(), any());
    }

    @Test
    void ownerAddsARealAccount() {
        when(access.userExists(memberId)).thenReturn(true);

        assertThat(service.addMember(owner, groupId, memberId)).contains(memberId);
        verify(access).addMember(groupId, memberId);
    }

    @Test
    void memberWithAnOpenBalanceCannotLeaveOrBeRemoved() {
        when(balances.openBalancesOf(groupId, memberId)).thenReturn(List.of(
                new DebtBalance(groupId, "Flat", memberId, ownerId, new BigDecimal("12.50"), "USD")));

        assertThatThrownBy(() -> service.removeMember(member, groupId, memberId))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
        assertThatThrownBy(() -> service.removeMember(owner, groupId, memberId))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
        verify(access, never()).removeMember(any(), any());
    }

    @Test
    void settledMemberCanLeave() {
        service.removeMember(member, groupId, memberId);

        verify(access).removeMember(groupId, memberId);
    }
}
