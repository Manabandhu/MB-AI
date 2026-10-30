package com.manabandhu.backend.expenses;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.foundation.CatalogMetric;

@ExtendWith(MockitoExtension.class)
class ExpensesContentServiceTest {

    @Mock ExpenseAccess access;
    @Mock ExpenseBalanceService balanceService;
    @Mock SettlementRepository settlementRepository;

    @InjectMocks ExpensesContentService service;

    private final UUID me = UUID.randomUUID();
    private final UUID friend = UUID.randomUUID();
    private final Actor actor = new Actor(me, false, false);

    @Test
    void homeShowsCallersGroupsAndNetPositionFromBalances() {
        var group = UUID.randomUUID();
        when(access.groupIdsFor(me)).thenReturn(List.of(group, UUID.randomUUID()));
        when(balanceService.balancesFor(actor)).thenReturn(List.of(
                new DebtBalance(group, "Trip", me, friend, new BigDecimal("12.5"), "USD"),
                new DebtBalance(group, "Trip", friend, me, new BigDecimal("40.00"), "USD"),
                new DebtBalance(group, "Trip", UUID.randomUUID(), me, new BigDecimal("2.333"), "USD")));

        var content = service.screen("home", Optional.of(actor));

        assertThat(content.metrics()).containsExactly(
                new CatalogMetric("Active groups", "2"),
                new CatalogMetric("You owe", "$12.50"),
                new CatalogMetric("Owed to you", "$42.33"));
    }

    @Test
    void settlementsAndBalancesComeFromRepositories() {
        when(settlementRepository.countForUserWithStatus(me, "pending")).thenReturn(3L);
        when(settlementRepository.countForUserWithStatus(me, "completed")).thenReturn(7L);
        assertThat(service.screen("settlements", Optional.of(actor)).metrics()).containsExactly(
                new CatalogMetric("Pending", "3"), new CatalogMetric("Completed", "7"));

        when(balanceService.balancesFor(actor)).thenReturn(List.of());
        List<Object[]> totals = List.<Object[]>of(new Object[] {"USD", new BigDecimal("312")});
        when(settlementRepository.completedTotalsForUser(me)).thenReturn(totals);
        assertThat(service.screen("balances", Optional.of(actor)).metrics()).containsExactly(
                new CatalogMetric("Open balances", "0"), new CatalogMetric("Settled", "$312.00"));
    }

    @Test
    void groupsCountsMembersAcrossCallersGroups() {
        when(access.groupIdsFor(me)).thenReturn(List.of(UUID.randomUUID()));
        when(access.memberCountAcrossGroupsOf(me)).thenReturn(4L);

        assertThat(service.screen("groups", Optional.of(actor)).metrics()).containsExactly(
                new CatalogMetric("Groups", "1"), new CatalogMetric("Members", "4"));
    }

    @Test
    void anonymousViewerGetsNoMetricsOnAnyScreen() {
        for (var screen : List.of("home", "groups", "balances", "settlements", "add")) {
            assertThat(service.screen(screen, Optional.empty()).metrics()).as(screen).isEmpty();
        }
        verifyNoInteractions(access, balanceService, settlementRepository);
    }

    @Test
    void moneyFormatsEachCurrencyWithTwoDecimals() {
        Map<String, BigDecimal> totals = new TreeMap<>(Map.of("USD", new BigDecimal("5"), "EUR", new BigDecimal("1.005")));
        assertThat(ExpensesContentService.money(totals)).isEqualTo("EUR 1.01, $5.00");
        assertThat(ExpensesContentService.money(Map.of())).isEqualTo("$0.00");
    }
}
