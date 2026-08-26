package com.manabandhu.backend.safety;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class SafetyGraphqlController {

    private final SafetyReportService reportService;
    private final BlockedUserService blockedUserService;
    private final TrustedContactService trustedContactService;

    SafetyGraphqlController(SafetyReportService reportService, BlockedUserService blockedUserService, TrustedContactService trustedContactService) {
        this.reportService = reportService;
        this.blockedUserService = blockedUserService;
        this.trustedContactService = trustedContactService;
    }

    @QueryMapping
    List<SafetyReport> safetyReports(Authentication authentication) {
        return reportService.findByReporter(UUID.fromString(authentication.getName()));
    }

    @MutationMapping
    SafetyReport createSafetyReport(Authentication authentication, @Argument @Valid CreateSafetyReportInput input) {
        var reporterId = UUID.fromString(authentication.getName());
        var targetId = UUID.fromString(input.targetId());
        var severity = SafetyReport.Severity.valueOf(input.severity());
        return reportService.create(reporterId, targetId, input.category(), input.description(), SafetyReport.ReportStatus.OPEN, severity, input.evidenceUrls());
    }

    @MutationMapping
    SafetyReport resolveSafetyReport(@Argument UUID id) {
        return reportService.resolve(id);
    }

    @QueryMapping
    List<BlockedUser> blockedUsers(Authentication authentication) {
        return blockedUserService.findByOwner(UUID.fromString(authentication.getName()));
    }

    @MutationMapping
    BlockedUser blockUser(Authentication authentication, @Argument @Valid BlockUserInput input) {
        var ownerId = UUID.fromString(authentication.getName());
        return blockedUserService.block(ownerId, UUID.fromString(input.blockedUserId()), input.reason());
    }

    @MutationMapping
    Boolean unblockUser(Authentication authentication, @Argument String blockedUserId) {
        var ownerId = UUID.fromString(authentication.getName());
        blockedUserService.unblock(ownerId, UUID.fromString(blockedUserId));
        return true;
    }

    @QueryMapping
    List<TrustedContact> trustedContacts(Authentication authentication) {
        return trustedContactService.findByOwner(UUID.fromString(authentication.getName()));
    }

    @MutationMapping
    TrustedContact createTrustedContact(Authentication authentication, @Argument @Valid CreateTrustedContactInput input) {
        return trustedContactService.create(UUID.fromString(authentication.getName()), input.name(), input.phone(), input.email(), input.relationship());
    }
}
