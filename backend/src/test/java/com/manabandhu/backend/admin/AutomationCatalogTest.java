package com.manabandhu.backend.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class AutomationCatalogTest {

    @Test
    void catalogIsAllowListedAndUnconfiguredWithoutServerCredentials() {
        var catalog = new AutomationCatalog("", "");

        assertThat(catalog.operations()).hasSize(7).allMatch(operation -> !operation.configured());
        assertThatThrownBy(() -> catalog.require("arbitrary-command"))
                .isInstanceOf(UnknownAutomationOperationException.class);
    }

    @Test
    void criticalOperationsRequireExplicitConfirmationBeforeDispatch() {
        var service = new AutomationService(new AutomationCatalog("token", "owner/repository"), "owner/repository", "token");
        var request = new ExecuteAutomationRequest("production", "main", "Approved emergency rollback", false);

        assertThatThrownBy(() -> service.execute("rollback-production", request, "operator-id"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        exception -> assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    }
}
