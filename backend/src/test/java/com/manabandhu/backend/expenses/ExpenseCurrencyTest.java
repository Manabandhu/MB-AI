package com.manabandhu.backend.expenses;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class ExpenseCurrencyTest {

    private final ExpenseGroup usdGroup = group("USD");

    @Test
    void defaultsToGroupCurrency() {
        assertThat(ExpenseAccess.groupCurrency(usdGroup, null)).isEqualTo("USD");
        assertThat(ExpenseAccess.groupCurrency(usdGroup, "usd")).isEqualTo("USD");
    }

    @Test
    void rejectsADifferentCurrency() {
        assertThatThrownBy(() -> ExpenseAccess.groupCurrency(usdGroup, "EUR"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    private static ExpenseGroup group(String currency) {
        var group = mock(ExpenseGroup.class);
        when(group.getCurrency()).thenReturn(currency);
        return group;
    }
}
