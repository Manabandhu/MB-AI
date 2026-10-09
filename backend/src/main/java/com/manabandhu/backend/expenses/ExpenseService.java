package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

/** Expenses inside a group. The caller pays; the amount is split equally across current members. */
@Service
public class ExpenseService {

    private final ExpenseRepository repository;
    private final ExpenseSplitRepository splitRepository;
    private final ExpenseAccess access;

    ExpenseService(ExpenseRepository repository, ExpenseSplitRepository splitRepository, ExpenseAccess access) {
        this.repository = repository;
        this.splitRepository = splitRepository;
        this.access = access;
    }

    @Transactional(readOnly = true)
    public List<Expense> listFor(Actor actor, UUID groupId) {
        access.requireMember(actor, groupId);
        return repository.findByGroupIdOrderByExpenseDateDesc(groupId);
    }

    @Transactional(readOnly = true)
    public Expense requireVisible(Actor actor, UUID expenseId) {
        var expense = repository.findById(expenseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense not found"));
        access.requireMember(actor, expense.getGroupId());
        return expense;
    }

    @Transactional(readOnly = true)
    public List<ExpenseSplit> splitsFor(Actor actor, UUID expenseId) {
        requireVisible(actor, expenseId);
        return splitRepository.findByExpenseId(expenseId);
    }

    @Transactional
    public Expense create(Actor actor, UUID groupId, CreateExpenseInput input) {
        var group = access.requireMember(actor, groupId);
        var currency = ExpenseAccess.groupCurrency(group, input.currency());
        var title = input.title() != null && !input.title().isBlank() ? input.title().trim() : input.description();
        var expense = repository.save(new Expense(groupId, actor.id(), input.amount(), currency, title,
                input.description(), input.category() != null ? input.category() : "GENERAL",
                input.splitType() != null ? input.splitType() : "EQUAL",
                input.expenseDate() != null ? input.expenseDate() : LocalDate.now()));
        splitRepository.saveAll(equalSplits(expense, participants(group, groupId)));
        return expense;
    }

    private List<UUID> participants(ExpenseGroup group, UUID groupId) {
        var members = new ArrayList<>(access.memberIds(groupId));
        if (!members.contains(group.getOwnerId())) members.add(0, group.getOwnerId());
        return members;
    }

    /** Splits to the cent; the first members absorb any leftover cents so shares always sum to the total. */
    static List<ExpenseSplit> equalSplits(Expense expense, List<UUID> members) {
        var count = BigDecimal.valueOf(members.size());
        var base = expense.getAmount().divide(count, 2, RoundingMode.DOWN);
        var remainderCents = expense.getAmount().subtract(base.multiply(count)).movePointRight(2).intValue();
        var splits = new ArrayList<ExpenseSplit>();
        for (var i = 0; i < members.size(); i++) {
            var share = i < remainderCents ? base.add(new BigDecimal("0.01")) : base;
            var userId = members.get(i);
            // The payer's own share is already paid.
            splits.add(new ExpenseSplit(expense.getId(), userId, share, userId.equals(expense.getPayerId())));
        }
        return splits;
    }
}
