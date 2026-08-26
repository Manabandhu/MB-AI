package com.manabandhu.backend.safety;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface SafetyReportRepository extends JpaRepository<SafetyReport, UUID> {
    List<SafetyReport> findByReporterIdOrderByCreatedAtDesc(UUID reporterId);
    List<SafetyReport> findByTargetIdOrderByCreatedAtDesc(UUID targetId);
}
