package com.manabandhu.backend.admin;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Moderation dashboards for the admin console. The security filter already limits /api/v1/admin/** to admins. */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminDirectoryController {

    record UpdateUserStatusInput(@NotBlank String status) {}

    private final AdminDirectoryService directory;
    private final AdminAuditService audit;
    private final AdminAccessPolicy accessPolicy;

    AdminDirectoryController(AdminDirectoryService directory, AdminAuditService audit, AdminAccessPolicy accessPolicy) {
        this.directory = directory;
        this.audit = audit;
        this.accessPolicy = accessPolicy;
    }

    @GetMapping("/users")
    List<AdminDirectoryService.AdminUser> users(Authentication authentication) {
        accessPolicy.require(authentication);
        return directory.users();
    }

    @GetMapping("/users/{id}")
    AdminDirectoryService.AdminUser user(Authentication authentication, @PathVariable UUID id) {
        accessPolicy.require(authentication);
        return directory.user(id);
    }

    @PatchMapping("/users/{id}/status")
    AdminDirectoryService.AdminUser updateUserStatus(Authentication authentication, @PathVariable UUID id,
                                                     @Valid @RequestBody UpdateUserStatusInput input) {
        accessPolicy.require(authentication);
        var user = directory.setStatus(id, input.status());
        audit.record(accessPolicy.actorId(authentication), "user." + input.status().toLowerCase(), "USER", id.toString());
        return user;
    }

    @GetMapping("/rooms")
    List<AdminDirectoryService.AdminRoom> rooms(Authentication authentication) {
        accessPolicy.require(authentication);
        return directory.rooms();
    }

    @GetMapping("/jobs")
    List<AdminDirectoryService.AdminJob> jobs(Authentication authentication) {
        accessPolicy.require(authentication);
        return directory.jobs();
    }

    @GetMapping("/events")
    List<AdminDirectoryService.AdminEvent> events(Authentication authentication) {
        accessPolicy.require(authentication);
        return directory.events();
    }

    @GetMapping("/community")
    List<AdminDirectoryService.AdminCommunityPost> community(Authentication authentication) {
        accessPolicy.require(authentication);
        return directory.communityPosts();
    }

    @GetMapping("/audit-log")
    List<AdminAuditService.AuditLogEntry> auditLog(Authentication authentication) {
        accessPolicy.require(authentication);
        return audit.recent(AdminDirectoryService.LIMIT);
    }
}
