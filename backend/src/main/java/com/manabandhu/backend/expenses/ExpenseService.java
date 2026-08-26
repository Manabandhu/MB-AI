package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExpenseService {

    private final ExpenseRepository repository;

    ExpenseService(ExpenseRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Expense> findByGroupId(UUID groupId) {
        return repository.findByGroupIdOrderByExpenseDateDesc(groupId);
    }

    @Transactional
    public Expense create(UUID groupId, UUID payerId, BigDecimal amount, String currency, String description, String category, LocalDate expenseDate) {
        return repository.save(new Expense(groupId, payerId, amount, currency, description, category, expenseDate));
    }
}
