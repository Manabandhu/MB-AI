package com.manabandhu.backend.admin;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
class AutomationCatalog {

    private final Map<String, Definition> definitions;

    AutomationCatalog(
            @Value("${app.automation.github.token:}") String token,
            @Value("${app.automation.github.repository:}") String repository) {
        var configured = !token.isBlank() && !repository.isBlank();
        definitions = new LinkedHashMap<>();
        register("quality-review", "Run end-to-end review", "Quality", "low", false, "quality.yml", configured);
        register("deploy-web", "Deploy web application", "Deployment", "medium", true, "deploy-web.yml", configured);
        register("deploy-backend", "Deploy backend", "Deployment", "high", true, "deploy-backend.yml", configured);
        register("release-mobile", "Build native release", "Deployment", "high", true, "release-mobile.yml", configured);
        register("apply-migrations", "Apply database migrations", "Database", "critical", true, "migrate.yml", configured);
        register("run-ai-evaluations", "Run AI safety evaluations", "AI", "medium", false, "ai-evaluations.yml", configured);
        register("rollback-production", "Rollback production", "Recovery", "critical", true, "rollback.yml", configured);
    }

    private void register(
            String id,
            String label,
            String category,
            String risk,
            boolean confirmation,
            String workflow,
            boolean configured) {
        definitions.put(id, new Definition(
                new AutomationOperation(id, label, workflowDescription(workflow), category, risk, confirmation, configured),
                workflow));
    }

    List<AutomationOperation> operations() {
        return definitions.values().stream().map(Definition::operation).toList();
    }

    Definition require(String id) {
        var definition = definitions.get(id);
        if (definition == null) throw new UnknownAutomationOperationException(id);
        return definition;
    }

    private static String workflowDescription(String workflow) {
        return "Dispatches the audited " + workflow + " GitHub Actions workflow.";
    }

    record Definition(AutomationOperation operation, String workflow) {}
}
