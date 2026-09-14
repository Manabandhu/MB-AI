package com.manabandhu.backend.admin;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.manabandhu.backend.safety.SafetyReport;
import com.manabandhu.backend.safety.SafetyReportService;

@RestController
@RequestMapping("/api/v1/admin/reports")
public class AdminReportsController {

    private final SafetyReportService reportService;
    private final AdminAccessPolicy accessPolicy;

    AdminReportsController(SafetyReportService reportService, AdminAccessPolicy accessPolicy) {
        this.reportService = reportService;
        this.accessPolicy = accessPolicy;
    }

    record AdminReportProjection(
            UUID id,
            String type,
            String targetId,
            String targetType,
            String reporterName,
            String reason,
            String status,
            String createdAt) {}

    @GetMapping
    List<AdminReportProjection> reports(Authentication authentication) {
        accessPolicy.require(authentication);
        return reportService.findAllForAdmin().stream()
                .map(r -> new AdminReportProjection(
                        r.getId(),
                        r.getCategory(),
                        r.getTargetId().toString(),
                        "CONTENT",
                        "Community Member (" + r.getReporterId().toString().substring(0, 8) + ")",
                        r.getDescription(),
                        r.getStatus().name(),
                        r.getCreatedAt().toString()))
                .toList();
    }

    @PostMapping("/{id}/resolve")
    AdminReportProjection resolve(Authentication authentication, @PathVariable UUID id) {
        accessPolicy.require(authentication);
        var r = reportService.resolve(id);
        return new AdminReportProjection(
                r.getId(),
                r.getCategory(),
                r.getTargetId().toString(),
                "CONTENT",
                "Community Member (" + r.getReporterId().toString().substring(0, 8) + ")",
                r.getDescription(),
                r.getStatus().name(),
                r.getCreatedAt().toString());
    }
}
