package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.manabandhu.backend.auth.Actor;

/**
 * Who owes whom. Each unpaid split is a debt from the member to the payer; each completed settlement pays a
 * debt down. Debts in both directions between the same pair are netted so each pair shows one figure.
 */
@Service
public class ExpenseBalanceService {

    private final ExpenseAccess access;
    private final ExpenseGroupRepository groupRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository splitRepository;
    private final SettlementRepository settlementRepository;

    ExpenseBalanceService(ExpenseAccess access, ExpenseGroupRepository groupRepository, ExpenseRepository expenseRepository,
                          ExpenseSplitRepository splitRepository, SettlementRepository settlementRepository) {
        this.access = access;
        this.groupRepository = groupRepository;
        this.expenseRepository = expenseRepository;
        this.splitRepository = splitRepository;
        this.settlementRepository = settlementRepository;
    }

    /** Balances across every group the caller belongs to, limited to debts the caller owes or is owed. */
    @Transactional(readOnly = true)
    public List<DebtBalance> balancesFor(Actor actor) {
        var groupIds = access.groupIdsFor(actor.id());
        if (groupIds.isEmpty()) return List.of();
        return balances(groupIds).stream()
                .filter(b -> actor.is(b.fromUserId()) || actor.is(b.toUserId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DebtBalance> balancesForGroup(Actor actor, UUID groupId) {
        access.requireMember(actor, groupId);
        return balances(List.of(groupId));
    }

    private List<DebtBalance> balances(List<UUID> groupIds) {
        var groups = groupRepository.findAllById(groupIds).stream()
                .collect(Collectors.toMap(ExpenseGroup::getId, Function.identity()));
        var expenses = expenseRepository.findByGroupIdIn(groupIds);
        var expensesById = expenses.stream().collect(Collectors.toMap(Expense::getId, Function.identity()));
        var splits = expensesById.isEmpty() ? List.<ExpenseSplit>of()
                : splitRepository.findByExpenseIdIn(new ArrayList<>(expensesById.keySet()));

        // ledger[group][debtor][creditor] = amount owed
        Map<UUID, Map<UUID, Map<UUID, BigDecimal>>> ledger = new HashMap<>();
        for (var split : splits) {
            var expense = expensesById.get(split.getExpenseId());
            if (split.isSettled() || split.getUserId().equals(expense.getPayerId())) continue;
            add(ledger, expense.getGroupId(), split.getUserId(), expense.getPayerId(), split.getShareAmount());
        }
        for (var settlement : settlementRepository.findByGroupIdIn(groupIds)) {
            if (!"completed".equals(settlement.getStatus())) continue;
            add(ledger, settlement.getGroupId(), settlement.getFromUserId(), settlement.getToUserId(),
                    settlement.getAmount().negate());
        }

        var result = new ArrayList<DebtBalance>();
        ledger.forEach((groupId, debtors) -> {
            var group = groups.get(groupId);
            var seen = new java.util.HashSet<String>();
            debtors.forEach((debtor, creditors) -> creditors.forEach((creditor, owed) -> {
                var key = debtor.compareTo(creditor) < 0 ? debtor + ":" + creditor : creditor + ":" + debtor;
                if (!seen.add(key)) return;
                var reverse = debtors.getOrDefault(creditor, Map.of()).getOrDefault(debtor, BigDecimal.ZERO);
                var net = owed.subtract(reverse);
                if (net.signum() > 0) {
                    result.add(balance(group, debtor, creditor, net));
                } else if (net.signum() < 0) {
                    result.add(balance(group, creditor, debtor, net.negate()));
                }
            }));
        });
        return result;
    }

    private static DebtBalance balance(ExpenseGroup group, UUID from, UUID to, BigDecimal amount) {
        return new DebtBalance(group.getId(), group.getName(), from, to, amount,
                group.getCurrency() != null ? group.getCurrency() : "USD");
    }

    private static void add(Map<UUID, Map<UUID, Map<UUID, BigDecimal>>> ledger, UUID groupId, UUID debtor,
                            UUID creditor, BigDecimal amount) {
        ledger.computeIfAbsent(groupId, k -> new HashMap<>())
                .computeIfAbsent(debtor, k -> new HashMap<>())
                .merge(creditor, amount, BigDecimal::add);
    }
}
