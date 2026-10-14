package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Group summary returned to clients, including member count and total spend. */
public record ExpenseGroupView(
        UUID id,
        String name,
        String description,
        String groupType,
        String currency,
        UUID createdBy,
        Instant createdAt,
        int memberCount,
        BigDecimal totalExpenses) {

    static ExpenseGroupView of(ExpenseGroup group, int memberCount, BigDecimal totalExpenses) {
        return new ExpenseGroupView(group.getId(), group.getName(), group.getDescription(),
                group.getGroupType() != null ? group.getGroupType() : "APARTMENT",
                group.getCurrency() != null ? group.getCurrency() : "USD",
                group.getOwnerId(), group.getCreatedAt(), memberCount, totalExpenses);
    }
}
