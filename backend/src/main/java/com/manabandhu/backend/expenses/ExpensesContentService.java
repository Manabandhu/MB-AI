package com.manabandhu.backend.expenses;

import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;
import com.manabandhu.backend.foundation.UnknownCatalogScreenException;

import org.springframework.stereotype.Service;

@Service
class ExpensesContentService {

    CatalogScreenContent screen(String screenId) {
        return switch (screenId) {
            case "home" -> content(
                    "Split expenses with trust",
                    "Track shared expenses, balances, and settlements across groups and trips.",
                    "Expenses",
                    java.util.List.of(
                            new CatalogMetric("Active groups", "4"),
                            new CatalogMetric("Outstanding", "$186.50")),
                    java.util.List.of(
                            item("groups", "Your groups", "Open groups you belong to with live balances.", "Groups", "/expenses/groups"),
                            item("balances", "Who owes whom", "See net balances and settlement suggestions.", "Balances", "/expenses/balances")));
            case "groups" -> content(
                    "Expense groups",
                    "Create and join expense groups for trips, roommates, and community events.",
                    "Expenses",
                    java.util.List.of(
                            new CatalogMetric("Groups", "4"),
                            new CatalogMetric("Members", "14")),
                    java.util.List.of(
                            item("create", "Create a group", "Start a group with name, members, and currency.", "Create", "/expenses/add"),
                            item("open", "Open groups", "View members, expenses, and settlement state.", "Groups", "/expenses/balances")));
            case "balances" -> content(
                    "Balances",
                    "See who owes whom across all groups with precise currency math.",
                    "Expenses",
                    java.util.List.of(
                            new CatalogMetric("Net positions", "6"),
                            new CatalogMetric("Settled", "$312.00")),
                    java.util.List.of(
                            item("net", "Net balances", "Per-person net position across all groups.", "Balances", "/expenses/settlements"),
                            item("history", "Settlement history", "Track completed settlements and audit trail.", "History", "/expenses/groups")));
            case "settlements" -> content(
                    "Settlements",
                    "Record and track payments between members with currency precision.",
                    "Expenses",
                    java.util.List.of(
                            new CatalogMetric("Pending", "2"),
                            new CatalogMetric("Completed", "5")),
                    java.util.List.of(
                            item("record", "Record a settlement", "Mark a payment between two members as settled.", "Settle", "/expenses/balances"),
                            item("audit", "Audit trail", "Review settlement timestamps and amounts.", "History", "/expenses/groups")));
            case "add" -> content(
                    "Add an expense",
                    "Record an expense with amount, currency, category, and participant splits.",
                    "Expenses",
                    java.util.List.of(
                            new CatalogMetric("Steps", "3"),
                            new CatalogMetric("Required fields", "5")),
                    java.util.List.of(
                            item("basics", "Basics", "Group, amount, currency, and description.", "Step 1", "/expenses/groups"),
                            item("splits", "Splits", "Divide amount across participants with precision.", "Step 2", "/expenses/balances")));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    private static CatalogScreenContent content(String title, String subtitle, String eyebrow,
                                                 java.util.List<CatalogMetric> metrics,
                                                 java.util.List<CatalogItem> items) {
        return new CatalogScreenContent(title, subtitle, eyebrow, metrics, items);
    }

    private static CatalogItem item(String id, String title, String body, String meta, String route) {
        return new CatalogItem(id, title, body, meta, route, null);
    }
}