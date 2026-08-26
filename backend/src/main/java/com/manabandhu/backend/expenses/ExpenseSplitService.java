package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExpenseSplitService {

    private final ExpenseSplitRepository repository;

    ExpenseSplitService(ExpenseSplitRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ExpenseSplit> findByExpenseId(UUID expenseId) {
        return repository.findByExpenseId(expenseId);
    }

    @Transactional
    public ExpenseSplit create(UUID expenseId, UUID userId, BigDecimal shareAmount, boolean settled) {
        return repository.save(new ExpenseSplit(expenseId, userId, shareAmount, settled));
    }
}
