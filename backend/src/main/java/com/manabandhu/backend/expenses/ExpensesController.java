package com.manabandhu.backend.expenses;

import java.net.URI;
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

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.foundation.CatalogScreenContent;

@RestController
@RequestMapping("/api/v1/expenses")
public class ExpensesController {

    private final ExpenseGroupService groupService;
    private final ExpenseService expenseService;
    private final SettlementService settlementService;
    private final ExpenseBalanceService balanceService;
    private final ExpensesContentService contentService;

    ExpensesController(ExpenseGroupService groupService, ExpenseService expenseService,
                       SettlementService settlementService, ExpenseBalanceService balanceService,
                       ExpensesContentService contentService) {
        this.groupService = groupService;
        this.expenseService = expenseService;
        this.settlementService = settlementService;
        this.balanceService = balanceService;
        this.contentService = contentService;
    }

    @GetMapping("/screens/{screenId}")
    CatalogScreenContent screen(@PathVariable String screenId) {
        return contentService.screen(screenId);
    }

    @GetMapping("/groups")
    List<ExpenseGroupView> groups(Authentication authentication) {
        return groupService.listFor(Actor.require(authentication));
    }

    @PostMapping("/groups")
    ResponseEntity<ExpenseGroupView> createGroup(Authentication authentication, @Valid @RequestBody CreateExpenseGroupInput input) {
        var group = groupService.create(Actor.require(authentication), input);
        return ResponseEntity.created(URI.create("/api/v1/expenses/groups/" + group.id())).body(group);
    }

    @GetMapping("/groups/{groupId}")
    ExpenseGroupView group(Authentication authentication, @PathVariable UUID groupId) {
        return groupService.viewFor(Actor.require(authentication), groupId);
    }

    @PatchMapping("/groups/{groupId}")
    ExpenseGroupView updateGroup(Authentication authentication, @PathVariable UUID groupId, @Valid @RequestBody UpdateExpenseGroupInput input) {
        return groupService.update(Actor.require(authentication), groupId, input.name(), input.description());
    }

    @DeleteMapping("/groups/{groupId}")
    ResponseEntity<Void> deleteGroup(Authentication authentication, @PathVariable UUID groupId) {
        groupService.delete(Actor.require(authentication), groupId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/groups/{groupId}/members")
    List<UUID> members(Authentication authentication, @PathVariable UUID groupId) {
        return groupService.members(Actor.require(authentication), groupId);
    }

    @PostMapping("/groups/{groupId}/members")
    List<UUID> addMember(Authentication authentication, @PathVariable UUID groupId, @Valid @RequestBody AddGroupMemberInput input) {
        return groupService.addMember(Actor.require(authentication), groupId, input.userId());
    }

    @DeleteMapping("/groups/{groupId}/members/{userId}")
    ResponseEntity<Void> removeMember(Authentication authentication, @PathVariable UUID groupId, @PathVariable UUID userId) {
        groupService.removeMember(Actor.require(authentication), groupId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/groups/{groupId}/expenses")
    List<Expense> expenses(Authentication authentication, @PathVariable UUID groupId) {
        return expenseService.listFor(Actor.require(authentication), groupId);
    }

    @PostMapping("/groups/{groupId}/expenses")
    ResponseEntity<Expense> addExpense(Authentication authentication, @PathVariable UUID groupId,
                                       @Valid @RequestBody CreateExpenseInput input) {
        var expense = expenseService.create(Actor.require(authentication), groupId, input);
        return ResponseEntity.created(URI.create("/api/v1/expenses/expenses/" + expense.getId())).body(expense);
    }

    @GetMapping("/groups/{groupId}/balances")
    List<DebtBalance> groupBalances(Authentication authentication, @PathVariable UUID groupId) {
        return balanceService.balancesForGroup(Actor.require(authentication), groupId);
    }

    @GetMapping("/groups/{groupId}/settlements")
    List<Settlement> groupSettlements(Authentication authentication, @PathVariable UUID groupId) {
        return settlementService.listForGroup(Actor.require(authentication), groupId);
    }

    @GetMapping("/expenses/{expenseId}")
    Expense expense(Authentication authentication, @PathVariable UUID expenseId) {
        return expenseService.requireVisible(Actor.require(authentication), expenseId);
    }

    @GetMapping("/expenses/{expenseId}/splits")
    List<ExpenseSplit> splits(Authentication authentication, @PathVariable UUID expenseId) {
        return expenseService.splitsFor(Actor.require(authentication), expenseId);
    }

    @GetMapping("/balances")
    List<DebtBalance> balances(Authentication authentication) {
        return balanceService.balancesFor(Actor.require(authentication));
    }

    @PostMapping("/groups/{groupId}/settlements")
    ResponseEntity<Settlement> createSettlement(Authentication authentication, @PathVariable UUID groupId,
                                                @Valid @RequestBody CreateSettlementInput input) {
        var settlement = settlementService.create(Actor.require(authentication), groupId, input);
        return ResponseEntity.created(URI.create("/api/v1/expenses/settlements/" + settlement.getId())).body(settlement);
    }

    @GetMapping("/settlements")
    List<Settlement> settlements(Authentication authentication) {
        return settlementService.listFor(Actor.require(authentication));
    }

    @GetMapping("/settlements/{settlementId}")
    Settlement settlement(Authentication authentication, @PathVariable UUID settlementId) {
        return settlementService.requireVisible(Actor.require(authentication), settlementId);
    }

    @PatchMapping("/settlements/{settlementId}")
    Settlement updateSettlement(Authentication authentication, @PathVariable UUID settlementId,
                                @Valid @RequestBody UpdateSettlementInput input) {
        return settlementService.updateStatus(Actor.require(authentication), settlementId, input.status(), input.settledAt());
    }
}
