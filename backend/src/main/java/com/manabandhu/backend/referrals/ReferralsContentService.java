package com.manabandhu.backend.referrals;

import java.util.List;
import java.util.Optional;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;
import com.manabandhu.backend.foundation.UnknownCatalogScreenException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Referral screens. Community totals count open referrals by type; "mine" counts the signed-in viewer's own
 * referrals and shows no metrics to anonymous viewers.
 */
@Service
class ReferralsContentService {

    /** Statuses that still need a response. New referrals are created as {@code pending}. */
    static final List<String> OPEN_STATUSES = List.of("pending", "open", "active");

    private final ReferralRepository repository;

    ReferralsContentService(ReferralRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    CatalogScreenContent screen(String screenId, Optional<Actor> viewer) {
        return switch (screenId) {
            case "home" -> content(
                    "Referrals and support",
                    "Request help, offer skills, and build trusted referral chains in your community.",
                    "Referrals",
                    List.of(
                            metric("Open requests", repository.countByTypeAndStatusIn("request", OPEN_STATUSES)),
                            metric("Active offers", repository.countByTypeAndStatusIn("offer", OPEN_STATUSES))),
                    List.of(
                            item("request", "Request help", "Ask your community for a referral or introduction.", "Open", "/referrals/request"),
                            item("offer", "Offer help", "Share your skills and availability with your community.", "Open", "/referrals/offer")));
            case "mine" -> content(
                    "My referrals",
                    "Track your requests, offers, and referral chain status in one place.",
                    "Referrals",
                    viewer.map(actor -> List.of(
                                    metric("Requests", repository.countByOwnerIdAndType(actor.id(), "request")),
                                    metric("Offers", repository.countByOwnerIdAndType(actor.id(), "offer"))))
                            .orElse(List.of()),
                    List.of(
                            item("requests", "My requests", "Track requests you have made and their status.", "Requests", "/referrals"),
                            item("offers", "My offers", "Manage offers you have made and their status.", "Offers", "/referrals/offer")));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    private static CatalogMetric metric(String label, long value) {
        return new CatalogMetric(label, String.valueOf(value));
    }

    private static CatalogScreenContent content(String title, String subtitle, String eyebrow,
                                                List<CatalogMetric> metrics, List<CatalogItem> items) {
        return new CatalogScreenContent(title, subtitle, eyebrow, metrics, items);
    }

    private static CatalogItem item(String id, String title, String body, String meta, String route) {
        return new CatalogItem(id, title, body, meta, route, null);
    }
}
