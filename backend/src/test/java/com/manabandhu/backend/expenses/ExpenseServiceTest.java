package com.manabandhu.backend.expenses;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.notifications.NotificationPublisher;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class ExpenseServiceTest {
    private final ExpenseRepository expenses = mock(ExpenseRepository.class);
    private final ExpenseSplitRepository splits = mock(ExpenseSplitRepository.class);
    private final ExpenseAccess access = mock(ExpenseAccess.class);
    private final ExpenseService service = new ExpenseService(expenses, splits, access, mock(NotificationPublisher.class));
    private final UUID groupId = UUID.randomUUID();
    private final Actor actor = new Actor(UUID.randomUUID(), false, false);

    private CreateExpenseInput input(String type) {
        return new CreateExpenseInput(new BigDecimal("12.00"), "USD", "Dinner", null, null, type, null);
    }

    @Test
    void unsupportedSplitTypesAreRejectedBeforeSaving() {
        for (var type : List.of("EXACT", "PERCENTAGE")) {
            assertThatThrownBy(() -> service.create(actor, groupId, input(type)))
                    .isInstanceOfSatisfying(ResponseStatusException.class,
                            e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        }
        verify(expenses, never()).save(any());
    }

    @Test
    void equalSplitReadsMembersUnderTheGroupLock() {
        var group = mock(ExpenseGroup.class);
        when(group.getOwnerId()).thenReturn(actor.id());
        when(group.getCurrency()).thenReturn("USD");
        when(access.requireMemberForUpdate(actor, groupId)).thenReturn(group);
        when(access.memberIds(groupId)).thenReturn(List.of(actor.id()));
        when(expenses.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        service.create(actor, groupId, input("EQUAL"));
        var order = inOrder(access);
        order.verify(access).requireMemberForUpdate(actor, groupId);
        order.verify(access).memberIds(groupId);
        verify(splits).saveAll(any());
    }
}
