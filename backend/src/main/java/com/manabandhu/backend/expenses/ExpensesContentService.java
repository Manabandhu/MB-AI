package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.function.Function;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;
import com.manabandhu.backend.foundation.UnknownCatalogScreenException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Expense screens. Every metric is the signed-in caller's own data (groups, balances, settlements);
 * anonymous viewers get no metrics rather than placeholder numbers.
 */
@Service
class ExpensesContentService {

    private final ExpenseAccess access;
    private final ExpenseBalanceService balanceService;
    private final SettlementRepository settlementRepository;

    ExpensesContentService(ExpenseAccess access, ExpenseBalanceService balanceService, SettlementRepository settlementRepository) {
        this.access = access;
        this.balanceService = balanceService;
        this.settlementRepository = settlementRepository;
    }

    @Transactional(readOnly = true)
    CatalogScreenContent screen(String screenId, Optional<Actor> viewer) {
        return switch (screenId) {
            case "home" -> content(
                    "Split expenses with trust",
                    "Track shared expenses, balances, and settlements across groups and trips.",
                    "Expenses",
                    personal(viewer, this::homeMetrics),
                    List.of(
                            item("groups", "Your groups", "Open groups you belong to with live balances.", "Groups", "/expenses/groups"),
                            item("balances", "Who owes whom", "See net balances and settlement suggestions.", "Balances", "/expenses/balances")));
            case "groups" -> content(
                    "Expense groups",
                    "Create and join expense groups for trips, roommates, and community events.",
                    "Expenses",
                    personal(viewer, actor -> List.of(
                            new CatalogMetric("Groups", String.valueOf(access.groupIdsFor(actor.id()).size())),
                            new CatalogMetric("Members", String.valueOf(access.memberCountAcrossGroupsOf(actor.id()))))),
                    List.of(
                            item("create", "Create a group", "Start a group with name, members, and currency.", "Create", "/expenses/add"),
                            item("open", "Open groups", "View members, expenses, and settlement state.", "Groups", "/expenses/balances")));
            case "balances" -> content(
                    "Balances",
                    "See who owes whom across all groups with precise currency math.",
                    "Expenses",
                    personal(viewer, actor -> List.of(
                            new CatalogMetric("Open balances", String.valueOf(balanceService.balancesFor(actor).size())),
                            new CatalogMetric("Settled", money(settledTotals(actor))))),
                    List.of(
                            item("net", "Net balances", "Per-person net position across all groups.", "Balances", "/expenses/settlements"),
                            item("history", "Settlement history", "Track completed settlements and audit trail.", "History", "/expenses/groups")));
            case "settlements" -> content(
                    "Settlements",
                    "Record and track payments between members with currency precision.",
                    "Expenses",
                    personal(viewer, actor -> List.of(
                            new CatalogMetric("Pending", String.valueOf(settlementRepository.countForUserWithStatus(actor.id(), "pending"))),
                            new CatalogMetric("Completed", String.valueOf(settlementRepository.countForUserWithStatus(actor.id(), "completed"))))),
                    List.of(
                            item("record", "Record a settlement", "Mark a payment between two members as settled.", "Settle", "/expenses/balances"),
                            item("audit", "Audit trail", "Review settlement timestamps and amounts.", "History", "/expenses/groups")));
            case "add" -> content(
                    "Add an expense",
                    "Record an expense with amount, currency, category, and participant splits.",
                    "Expenses",
                    List.of(),
                    List.of(
                            item("basics", "Basics", "Group, amount, currency, and description.", "Step 1", "/expenses/groups"),
                            item("splits", "Splits", "Divide amount across participants with precision.", "Step 2", "/expenses/balances")));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    private List<CatalogMetric> homeMetrics(Actor actor) {
        var groups = access.groupIdsFor(actor.id()).size();
        Map<String, BigDecimal> youOwe = new TreeMap<>();
        Map<String, BigDecimal> owedToYou = new TreeMap<>();
        for (var balance : balanceService.balancesFor(actor)) {
            if (actor.is(balance.fromUserId())) {
                youOwe.merge(balance.currency(), balance.amount(), BigDecimal::add);
            } else if (actor.is(balance.toUserId())) {
                owedToYou.merge(balance.currency(), balance.amount(), BigDecimal::add);
            }
        }
        return List.of(
                new CatalogMetric("Active groups", String.valueOf(groups)),
                new CatalogMetric("You owe", money(youOwe)),
                new CatalogMetric("Owed to you", money(owedToYou)));
    }

    private Map<String, BigDecimal> settledTotals(Actor actor) {
        Map<String, BigDecimal> totals = new TreeMap<>();
        for (var row : settlementRepository.completedTotalsForUser(actor.id())) {
            var currency = row[0] != null ? row[0].toString() : "USD";
            var amount = row[1] instanceof BigDecimal value ? value : BigDecimal.ZERO;
            totals.merge(currency, amount, BigDecimal::add);
        }
        return totals;
    }

    /** Formats per-currency totals, e.g. "$186.50" or "$10.00, EUR 4.25"; no amounts reads "$0.00". */
    static String money(Map<String, BigDecimal> totals) {
        if (totals.isEmpty()) return "$0.00";
        var parts = new ArrayList<String>();
        totals.forEach((currency, amount) -> {
            var value = amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
            parts.add("USD".equalsIgnoreCase(currency) ? "$" + value : currency.toUpperCase() + " " + value);
        });
        return String.join(", ", parts);
    }

    private static List<CatalogMetric> personal(Optional<Actor> viewer, Function<Actor, List<CatalogMetric>> metrics) {
        return viewer.map(metrics).orElse(List.of());
    }

    private static CatalogScreenContent content(String title, String subtitle, String eyebrow,
                                                List<CatalogMetric> metrics, List<CatalogItem> items) {
        return new CatalogScreenContent(title, subtitle, eyebrow, metrics, items);
    }

    private static CatalogItem item(String id, String title, String body, String meta, String route) {
        return new CatalogItem(id, title, body, meta, route, null);
    }
}
