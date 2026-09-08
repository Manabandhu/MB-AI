package com.manabandhu.backend.safety;

import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;

import org.springframework.stereotype.Service;

@Service
class SafetyContentService {

    CatalogScreenContent center() {
        return new CatalogScreenContent(
                "Safety center",
                "Manage reports, blocked users, trusted contacts, and emergency escalation.",
                "Safety",
                java.util.List.of(
                        new CatalogMetric("Open reports", "3"),
                        new CatalogMetric("Blocked users", "4")),
                java.util.List.of(
                        new CatalogItem("reports", "Your reports", "Track reports you have submitted and their status.", "Open reports", "/safety/reports", null),
                        new CatalogItem("blocked", "Blocked users", "Manage users you have blocked and the reasons.", "Blocked", "/safety/blocked-users", null),
                        new CatalogItem("trusted", "Trusted contacts", "Manage people you trust for safety check-ins.", "Trusted", "/safety/trusted-contacts", null)));
    }
}