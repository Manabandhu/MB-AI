package com.manabandhu.backend.safety;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/safety")
public class SafetyController {

    private final SafetyReportService reportService;
    private final BlockedUserService blockedUserService;
    private final TrustedContactService trustedContactService;
    private final SafetyContentService contentService;

    SafetyController(SafetyReportService reportService, BlockedUserService blockedUserService, TrustedContactService trustedContactService, SafetyContentService contentService) {
        this.reportService = reportService;
        this.blockedUserService = blockedUserService;
        this.trustedContactService = trustedContactService;
        this.contentService = contentService;
    }

    @GetMapping("/center")
    com.manabandhu.backend.foundation.CatalogScreenContent center() {
        return contentService.center();
    }

    @GetMapping("/reports")
    List<SafetyReport> reports(Authentication authentication) {
        return reportService.findByReporter(UUID.fromString(authentication.getName()));
    }

    @PostMapping("/reports")
    ResponseEntity<SafetyReport> createReport(Authentication authentication, @Valid @RequestBody CreateSafetyReportInput input) {
        var reporterId = UUID.fromString(authentication.getName());
        var targetId = UUID.fromString(input.targetId());
        var severity = SafetyReport.Severity.valueOf(input.severity());
        var report = reportService.create(reporterId, targetId, input.category(), input.description(), SafetyReport.ReportStatus.OPEN, severity, input.evidenceUrls());
        return ResponseEntity.created(URI.create("/api/v1/safety/reports/" + report.getId())).body(report);
    }

    @PostMapping("/reports/{id}/resolve")
    ResponseEntity<Void> resolveReport(@PathVariable UUID id) {
        reportService.resolve(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/blocked-users")
    List<BlockedUser> blockedUsers(Authentication authentication) {
        return blockedUserService.findByOwner(UUID.fromString(authentication.getName()));
    }

    @PostMapping("/blocked-users")
    ResponseEntity<BlockedUser> blockUser(Authentication authentication, @Valid @RequestBody BlockUserInput input) {
        var ownerId = UUID.fromString(authentication.getName());
        var blockedUserId = UUID.fromString(input.blockedUserId());
        var blocked = blockedUserService.block(ownerId, blockedUserId, input.reason());
        return ResponseEntity.created(URI.create("/api/v1/safety/blocked-users/" + blocked.getId())).body(blocked);
    }

    @PostMapping("/blocked-users/{blockedUserId}/unblock")
    ResponseEntity<Void> unblockUser(Authentication authentication, @PathVariable UUID blockedUserId) {
        var ownerId = UUID.fromString(authentication.getName());
        blockedUserService.unblock(ownerId, blockedUserId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/trusted-contacts")
    List<TrustedContact> trustedContacts(Authentication authentication) {
        return trustedContactService.findByOwner(UUID.fromString(authentication.getName()));
    }

    @PostMapping("/trusted-contacts")
    ResponseEntity<TrustedContact> createTrustedContact(Authentication authentication, @Valid @RequestBody CreateTrustedContactInput input) {
        var contact = trustedContactService.create(UUID.fromString(authentication.getName()), input.name(), input.phone(), input.email(), input.relationship());
        return ResponseEntity.created(URI.create("/api/v1/safety/trusted-contacts/" + contact.getId())).body(contact);
    }
}
