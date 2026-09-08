package com.manabandhu.backend.expenses;

import java.net.URI;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/expenses")
public class ExpensesController {

    private final ExpenseGroupService groupService;
    private final ExpenseService expenseService;
    private final ExpenseSplitService splitService;
    private final SettlementService settlementService;
    private final ExpensesContentService contentService;

    ExpensesController(ExpenseGroupService groupService, ExpenseService expenseService,
                       ExpenseSplitService splitService, SettlementService settlementService,
                       ExpensesContentService contentService) {
        this.groupService = groupService;
        this.expenseService = expenseService;
        this.splitService = splitService;
        this.settlementService = settlementService;
        this.contentService = contentService;
    }

    @GetMapping("/screens/{screenId}")
    CatalogScreenContent screen(@PathVariable String screenId) {
        return contentService.screen(screenId);
    }

    @GetMapping("/groups")
    List<ExpenseGroup> groups() {
        return groupService.findAll();
    }

    @PostMapping("/groups")
    ResponseEntity<ExpenseGroup> createGroup(Authentication authentication, @Valid @RequestBody CreateExpenseGroupInput input) {
        var group = groupService.create(UUID.fromString(authentication.getName()), input.name(), input.description());
        return ResponseEntity.created(URI.create("/api/v1/expenses/groups/" + group.getId())).body(group);
    }

    @GetMapping("/groups/{groupId}")
    ExpenseGroup group(@PathVariable UUID groupId) {
        return groupService.findById(groupId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Expense group not found"));
    }

    @PatchMapping("/groups/{groupId}")
    ExpenseGroup updateGroup(@PathVariable UUID groupId, @Valid @RequestBody UpdateExpenseGroupInput input) {
        return groupService.update(groupId, input.name(), input.description());
    }

    @DeleteMapping("/groups/{groupId}")
    ResponseEntity<Void> deleteGroup(@PathVariable UUID groupId) {
        groupService.delete(groupId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/groups/{groupId}/expenses")
    List<Expense> expenses(@PathVariable UUID groupId) {
        return expenseService.findByGroupId(groupId);
    }

    @PostMapping("/groups/{groupId}/expenses")
    ResponseEntity<Expense> addExpense(Authentication authentication, @PathVariable UUID groupId,
                                       @Valid @RequestBody CreateExpenseInput input) {
        var expense = expenseService.create(groupId, UUID.fromString(authentication.getName()), input.amount(),
                input.currency(), input.description(), input.category(), input.expenseDate());
        return ResponseEntity.created(URI.create("/api/v1/expenses/expenses/" + expense.getId())).body(expense);
    }

    @GetMapping("/expenses/{expenseId}")
    Expense expense(@PathVariable UUID expenseId) {
        return expenseService.findByGroupId(expenseId).stream()
                .filter(e -> e.getId().equals(expenseId))
                .findFirst()
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Expense not found"));
    }

    @GetMapping("/expenses/{expenseId}/splits")
    List<ExpenseSplit> splits(@PathVariable UUID expenseId) {
        return splitService.findByExpenseId(expenseId);
    }

    @PostMapping("/groups/{groupId}/settlements")
    ResponseEntity<Settlement> createSettlement(Authentication authentication, @PathVariable UUID groupId,
                                                @Valid @RequestBody CreateSettlementInput input) {
        var settlement = settlementService.create(groupId, UUID.fromString(authentication.getName()),
                input.toUserId(), input.amount(), input.currency(), input.status(), input.settledAt());
        return ResponseEntity.created(URI.create("/api/v1/expenses/settlements/" + settlement.getId())).body(settlement);
    }

    @GetMapping("/settlements")
    List<Settlement> settlements() {
        return settlementService.findByGroupId(null);
    }

    @GetMapping("/settlements/{settlementId}")
    Settlement settlement(@PathVariable UUID settlementId) {
        return settlementService.findByGroupId(null).stream()
                .filter(s -> s.getId().equals(settlementId))
                .findFirst()
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Settlement not found"));
    }

    @PatchMapping("/settlements/{settlementId}")
    Settlement updateSettlement(@PathVariable UUID settlementId, @Valid @RequestBody UpdateSettlementInput input) {
        var settlements = settlementService.findByGroupId(null);
        var settlement = settlements.stream()
                .filter(s -> s.getId().equals(settlementId))
                .findFirst()
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Settlement not found"));
        if (input.status() != null) settlement.status = input.status();
        if (input.settledAt() != null) settlement.settledAt = input.settledAt();
        return settlement;
    }
}
