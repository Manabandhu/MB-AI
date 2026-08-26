package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class ExpensesGraphqlController {

    private final ExpenseGroupService groupService;
    private final ExpenseService expenseService;
    private final SettlementService settlementService;

    ExpensesGraphqlController(ExpenseGroupService groupService, ExpenseService expenseService, SettlementService settlementService) {
        this.groupService = groupService;
        this.expenseService = expenseService;
        this.settlementService = settlementService;
    }

    @QueryMapping
    List<ExpenseGroup> expenseGroups() {
        return groupService.findAll();
    }

    @QueryMapping
    List<Expense> expenses(@Argument UUID groupId) {
        return expenseService.findByGroupId(groupId);
    }

    @QueryMapping
    List<Settlement> settlements(@Argument UUID groupId) {
        return settlementService.findByGroupId(groupId);
    }

    @MutationMapping
    ExpenseGroup createExpenseGroup(Authentication authentication, @Argument @Valid CreateExpenseGroupInput input) {
        return groupService.create(UUID.fromString(authentication.getName()), input.name(), input.description());
    }

    @MutationMapping
    Expense createExpense(Authentication authentication, @Argument UUID groupId, @Argument @Valid CreateExpenseInput input) {
        return expenseService.create(groupId, UUID.fromString(authentication.getName()), input.amount(), input.currency(),
                input.description(), input.category(), input.expenseDate());
    }

    @MutationMapping
    Settlement createSettlement(Authentication authentication, @Argument UUID groupId, @Argument @Valid CreateSettlementInput input) {
        return settlementService.create(groupId, UUID.fromString(authentication.getName()), input.toUserId(), input.amount(),
                input.currency(), input.status(), input.settledAt());
    }
}
